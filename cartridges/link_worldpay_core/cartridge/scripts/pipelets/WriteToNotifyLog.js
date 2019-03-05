/**
* Demandware Script File
*  This Script writes the logs of failed orders to file at Impex location
*
*   @input errorList : dw.util.ArrayList
*   @output filePath : String
*
*/
var io = require('dw/io');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var WorldpayConstants = require('link_worldpay_core/cartridge/scripts/common/WorldpayConstants');
/**
* This Method creates the folder if not exists.
* @param {string} folder name.
* @return {boolean} folder exists.
*/
function createFolder(folder) {
    var localFolder = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + folder);
    if (localFolder.exists()) {
        return true;
    }
  // create folder
    var result = localFolder.mkdirs();
    if (!result) {
        Logger.getLogger('logfile').error('Order Notification Mail : Error creating folder :' + localFolder.fullPath);
        return false;
    }
    return true;
}

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
    var dateString = StringUtils.formatCalendar(calendar, 'yyyy-MM-dd');
    return dateString;
}

/**
* This Method writes to notify log.
* @param {dw.util.ArrayList} errorList  of errors in errorList.
* @return {Object} returns an jsosn object with status.
*/
function writeToNotifyLog(errorList) {
    var notifyLogFolderName = 'OrderNotificationsLog';
    var notifyLogFileName = 'OrderNotificationsLogFile_' + getCurrentDateString();

    // createfolder for logs in Impex
    var fileName = io.File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + notifyLogFolderName + File.SEPARATOR + notifyLogFileName;

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
        Logger.getLogger('worldpay').error('Order Notification Email : ' + ex);
    }
    var System = require('dw/system/System');
    var instanceName = WorldpayConstants.PMETHOD + System.getInstanceHostname() + WorldpayConstants.WEVDAVPATH;
    var filePath = instanceName + File.SEPARATOR + fileName;
    return { success: true, filePath: filePath };
}

/** Exported functions **/
module.exports = {
    writeToNotifyLog: writeToNotifyLog
};
