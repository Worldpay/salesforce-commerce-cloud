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
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var Site = require('dw/system/Site');

/**
* This Method creates the folder if not exists.
* @param {string} folder name.
* @return {boolean} folder exists.
*/
function createFolder(folder) {
    var localFolder = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + folder + File.SEPARATOR + Site.getCurrent().getID());
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
    var dateString = StringUtils.formatCalendar(calendar, 'yyyy-MM-dd_HH:mm:ss');
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
    var fileName = 'Impex' + File.SEPARATOR + 'src' + File.SEPARATOR + notifyLogFolderName + File.SEPARATOR + Site.getCurrent().getID() + File.SEPARATOR + notifyLogFileName;
    var logFilePath = 'Impex' + File.SEPARATOR + 'src' + File.SEPARATOR + notifyLogFolderName + File.SEPARATOR + Site.getCurrent().getID();

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
    var filePath = instanceName + File.SEPARATOR + logFilePath;
    return { success: true, filePath: filePath, fileName: notifyLogFileName };
}

/**
* This Method writes to notify the list of fraud sight risk orders.
* @param {dw.util.ArrayList} fraudSightRiskOrders -- fraud risk orders.
* @return {Object} returns a json object with status.
*/
function writeToNotifyFraudRiskOrders(fraudSightRiskOrders) {
    var System = require('dw/system/System');
    var CSVStreamWriter = require('dw/io/CSVStreamWriter');
    var FileWriter = require('dw/io/FileWriter');
    var Resource = require('dw/web/Resource');
    var orderNum = Resource.msg('fraudsight.risk.order.number', 'worldpay', null);
    var fraudSightScore = Resource.msg('fraudsight.risk.score', 'worldpay', null);
    var fraudSightScoreMsg = Resource.msg('fraudsight.risk.message', 'worldpay', null);
    var fraudSightScoreReason = Resource.msg('fraudsight.risk.reason', 'worldpay', null);
    var riskFinalScore = Resource.msg('risk.finalScore', 'worldpay', null);
    var riskMessage = Resource.msg('risk.message', 'worldpay', null);
    var riskProvider = Resource.msg('risk.provider', 'worldpay', null);
    var HEADER = [orderNum, fraudSightScore, fraudSightScoreMsg, fraudSightScoreReason, riskFinalScore, riskMessage, riskProvider];
    var fraudRiskOrdersFolderName = 'FraudSightRiskOders';
    var fraudSightRiskOdersFileName = 'FraudSightRiskOdersFile_' + getCurrentDateString();
    var fileName = 'Impex' + File.SEPARATOR + 'src' + File.SEPARATOR + fraudRiskOrdersFolderName + File.SEPARATOR + Site.getCurrent().getID() + File.SEPARATOR + fraudSightRiskOdersFileName;
    var csvFilePath = 'Impex' + File.SEPARATOR + 'src' + File.SEPARATOR + fraudRiskOrdersFolderName + File.SEPARATOR + Site.getCurrent().getID();
    if (!createFolder(fraudRiskOrdersFolderName)) {
        return { success: false };
    }
    var file = new File(fileName + '.csv');
    var fileWriter = new FileWriter(file);
    var csvWriter = new CSVStreamWriter(fileWriter);
    csvWriter.writeNext(HEADER);
    fraudSightRiskOrders.forEach(function (riskOrder) {
        var values = [riskOrder.orderNumber, riskOrder.fraudSightRiskScore,
            riskOrder.fraudSightRiskMessage,
            riskOrder.fraudSightRiskReason, riskOrder.riskFinalScore,
            riskOrder.riskMessage, riskOrder.riskProvider];
        csvWriter.writeNext(values);
    });
    csvWriter.close();
    fileWriter.close();
    var instanceName = WorldpayConstants.PMETHOD + System.getInstanceHostname() + WorldpayConstants.WEVDAVPATH;
    var filePath = instanceName + File.SEPARATOR + csvFilePath;
    return { success: true, filePath: filePath, fileName: fraudSightRiskOdersFileName };
}

/** Exported functions **/
module.exports = {
    writeToNotifyLog: writeToNotifyLog,
    writeToNotifyFraudRiskOrders: writeToNotifyFraudRiskOrders
};
