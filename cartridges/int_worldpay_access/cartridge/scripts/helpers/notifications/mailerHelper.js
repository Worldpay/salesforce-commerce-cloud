'use strict';

const Site = require('dw/system/Site');
const HashMap = require('dw/util/HashMap');
const Template = require('dw/util/Template');
const Mail = require('dw/net/Mail');
const Resource = require('dw/web/Resource');
const File = require('dw/io/File');
const Logger = require('dw/system/Logger');
const io = require('dw/io');

/**
 * This Method returns the current GMT date in yyyy-MM-dd format.
 * @return {string} the date string.
 */
function getCurrentDateString() {
    var Calendar = require('dw/util/Calendar');
    var calendar = new Calendar();
    // for data exchanges we always use GMT
    calendar.timeZone = 'GMT';
    var StringUtils = require('dw/util/StringUtils');
    return StringUtils.formatCalendar(calendar, 'yyyy-MM-dd_HH:mm:ss');
}

/**
 * This Method creates the folder if not exists.
 * @param {string} folder name.
 * @return {boolean} folder exists.
 */
function createFolder(folder) {
    var localFolder = new File(
        File.IMPEX +
            File.SEPARATOR +
            'src' +
            File.SEPARATOR +
            folder +
            File.SEPARATOR +
            Site.getCurrent().getID()
    );
    if (localFolder.exists()) {
        return true;
    }
    // create folder
    var result = localFolder.mkdirs();
    if (!result) {
        Logger.getLogger('awp').error(
            'Order Notification Mail : Error creating folder :' +
                localFolder.fullPath
        );
        return false;
    }
    return true;
}

/**
 * This Method writes to notify log.
 * @param {dw.util.ArrayList} errorList  of errors in errorList.
 * @return {Object} returns an jsosn object with status.
 */
function writeToNotifyLog(errorList) {
    var notifyLogFolderName = 'OrderNotificationsLog';
    var notifyLogFileName =
        'OrderNotificationsLogFile_' + getCurrentDateString();

    // createfolder for logs in Impex
    var fileName =
        'Impex' +
        File.SEPARATOR +
        'src' +
        File.SEPARATOR +
        notifyLogFolderName +
        File.SEPARATOR +
        Site.getCurrent().getID() +
        File.SEPARATOR +
        notifyLogFileName;

    var logFilePath =
        'Impex' +
        File.SEPARATOR +
        'src' +
        File.SEPARATOR +
        notifyLogFolderName +
        File.SEPARATOR +
        Site.getCurrent().getID();

    if (!createFolder(notifyLogFolderName)) {
        return { success: false };
    }

    try {
        var xmlFile = new File(fileName);
        var xmlFileWriter = new io.FileWriter(xmlFile, 'UTF-8', true);
        for (var i = errorList.length - 1; i >= 0; i--) {
            xmlFileWriter.writeLine(errorList[i]);
        }
        xmlFileWriter.flush();
        xmlFileWriter.close();
    } catch (ex) {
        Logger.getLogger('awp').error('Order Notification Email : ' + ex);
    }
    var System = require('dw/system/System');
    var instanceName =
        'https://' +
        System.getInstanceHostname() +
        '/on/demandware.servlet/webdav/Sites';
    var filePath = instanceName + File.SEPARATOR + logFilePath;
    return { success: true, filePath: filePath, fileName: notifyLogFileName };
}

/**
 * Job mail service for sending email notifications about job status
 * @param {Object} params - The parameters for the email
 * @param {number} params.errorCount - The number of errors occurred
 * @param {dw.util.ArrayList} params.errorList - The list of error messages
 * @param {number} params.totalCount - The total number of processed orders
 */
const jobMailService = ({ errorList, totalCount, errorCount }) => {
    let writeToNotifyLogResult = writeToNotifyLog(errorList);

    let mailTo =
        Site.getCurrent().getCustomPreferenceValue('NotifyJobMailTo') || '';
    let mailFrom =
        Site.getCurrent().getCustomPreferenceValue('NotifyJobMailFrom') || '';
    let mailCC =
        Site.getCurrent().getCustomPreferenceValue('NotifyJobMailCC') || '';
    let mailSubject = Resource.msg(
        'notify.job.email.subjectLine',
        'common',
        null
    ).toString();

    let renderingParameters = new HashMap();
    renderingParameters.put('totalCount', totalCount);
    renderingParameters.put('errorCount', errorCount);
    renderingParameters.put('filePath', writeToNotifyLogResult.filePath);
    renderingParameters.put('fileName', writeToNotifyLogResult.fileName);
    let template = new Template('emailtemplateforjob.isml');
    let content = template.render(renderingParameters);

    let mail = new Mail();
    mail.addTo(mailTo);
    mail.setFrom(mailFrom);
    mail.addCc(mailCC);
    mail.setSubject(mailSubject);
    mail.setContent(content);
    mail.send();
};

/**
 * Generates and adds a formatted error message to the error list for job notifications.
 * @param {string} errorMessage - The base error message.
 * @param {string | null} orderNo - The order number associated with the error.
 * @param {string | null} payload - The XML string for the error message (optional).
 * @return {Object} An object containing success status, the formatted error string, and the updated error list.
 */
function generateJobResultError(errorMessage, orderNo, payload) {
    const orderInfo = `Order No.= ${orderNo}`;
    let formattedError = errorMessage
        ? `${errorMessage}<br/> ${orderInfo}`
        : orderInfo;

    if (payload == null) {
        return formattedError;
    }
    return `${orderInfo} : Payload String :${JSON.stringify(
        payload
    )} : ERROR for :${formattedError}`;
}

/**
 * Singleton class to record job results
 */
const JobResult = (function () {
    let instance;

    /**
     * Creates a new job result instance for tracking job execution details.
     * @returns {Object} An object with errorCount, errorString, errorList, and totalCount properties.
     */
    function createInstance() {
        const ArrayList = require('dw/util/ArrayList');
        return {
            errorCount: 0,
            errorList: new ArrayList(),
            totalCount: 0
        };
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        },
        reset: function () {
            instance = createInstance();
        },
        /**
         * Adds an error message to the errorList and increments errorCount.
         * @param {string} errorMsg - The error message to add.
         * @param {string | null } orderNo - The order number associated with the error.
         * @param {string | null} payload - The XML string for the error message (optional).
         */
        addError: function (errorMsg, orderNo, payload) {
            const enableJobMailerService =
                Site.getCurrent().getCustomPreferenceValue(
                    'EnableJobMailerService'
                );
            if (!enableJobMailerService) return;
            if (!instance) {
                instance = createInstance();
            }
            const jobResultError = generateJobResultError(
                errorMsg,
                orderNo,
                payload
            );

            instance.errorList.add(jobResultError);
            instance.errorCount++;
        }
    };
})();

module.exports = {
    jobMailService,
    JobResult
};
