import * as testData from '../../../testDataMgr/main';

export const BTN_LOGIN = '.login .btn-block';
export const INPUT_EMAIL = '#login-form-email';
export const INPUT_PASSWORD = '#login-form-password';

/**
 * Fill in login form
 */
export function loginAs(login, password) {
    // After several trials, 30000 yields the fewest number of test failures
    // involving this waitForVisible
    var resultPassword = password || testData.defaultPassword;

    return browser.waitForVisible(INPUT_EMAIL, 30000)
        .setValue(INPUT_EMAIL, login)
        .setValue(INPUT_PASSWORD, resultPassword)
        .click(BTN_LOGIN);
}
