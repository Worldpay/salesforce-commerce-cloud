const I = actor();

module.exports = {
    locators: {
        consentTrackModal: '.modal-content',
        consentTrackAffirm: '.affirm',
        searchField: 'input.form-control.search-field',
        searchedImage: 'a>img.swatch-circle'
    },
    accept() {
        I.waitForElement({xpath: '//*[@id="consent-tracking"]/div/div/div[3]/div/button[1]'});
        I.click({xpath: '//*[@id="consent-tracking"]/div/div/div[3]/div/button[1]'});
        I.wait(1);
        
    },
    search(product) {
        I.fillField(this.locators.searchField, product);
        I.waitForElement(this.locators.searchedImage);
        I.click(this.locators.searchedImage);
    }
};
