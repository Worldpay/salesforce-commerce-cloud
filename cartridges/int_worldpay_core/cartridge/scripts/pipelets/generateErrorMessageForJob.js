/**
* This Script generates the error message for the mail.
 * @param {string} errorMessage error message string
 * @param {string} orderNo order number
 * @param {string} xmlstring xml string for error message
 * @param {dw.util.ArrayList} errorList array list having error list
 * @return {Object} returns an json object
*/
function generateErrorMessageForJob(errorMessage, orderNo, xmlstring, errorList) {
    var errorString = errorMessage;
    var errorCurrent = ' Order No.= ' + orderNo;
    if (!errorString) {
        errorString = ' Order No.= ' + orderNo;
    } else {
        errorString = errorString + '<br/> Order No.= ' + orderNo;
    }

    var errorForArray = errorCurrent + ' : XML String :' + xmlstring + ' : ERROR for :' + errorString;
    if (xmlstring == null) {
        errorList.addAt(0, errorString);
    } else {
        errorList.addAt(0, errorForArray);
    }
    return { success: true, errorString: errorString, errorListResult: errorList };
}

/** Exported functions **/
module.exports = {
    generateErrorMessageForJob: generateErrorMessageForJob
};
