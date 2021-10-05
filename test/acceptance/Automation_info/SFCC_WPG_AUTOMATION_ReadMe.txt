Following are the pre-requisites and steps to run the codeceptjs automation suite for sfcc-wpg :
==============================================================================================
CodeceptJS:
===========
1. Make sure the chrome driver version is properly set in the default-config file which is in the <InstalledDir>\node_modules\selenium-standalone\lib 

SFCC BM:
========
1. Make sure Exemption Engine is turned off in Merchant Tools > Custom Preferences > Worldpay-SecureTransaction. 
2. Make sure the sufficient inventory is available for the PID: 013742333299M (Hammered Gold Earrings) in RefArch site.  
3. Make sure the Cartridge path is set to 'int_worldpay_sfra:int_worldpay_core:int_worldpay_csc:app_storefront_base' for RefArch site in Administration > Sites > Manage Sites > 
4. Make sure Redirect credit card payments must be in page format. To do this, go to the payment method section and reset any configurations that are set to iframe or light box format.

codecept.conf (Path where "test" directory is present) & uriUrils (Path: test\acceptance\utils):
===============================================================================================
1. Make sure proper domain url is configured in codecept.conf.js and path url in uriUtils.js. Currently the automation is configured to run on RefArch site with US locale.

How to run Automation:
=====================
1. Run cmd/bash from root location where test folder exists with 'npm run test:acceptance' command. 
Note: Automation takes 40-45 mins to run all the 40 test cases. 

How to generate Allure report:
==============================
1. Run cmd/bash from root location where test folder exists with 'npm run test:acceptance:launchReport' command. 

Coverage:
=========
Automation acceptance test scenarios are present in the test\acceptance\features\TestSuites folder. The acceptance test suite consists of 40 test cases which covers Credit/Debit Card payments with non-3ds & 3ds (3ds1, 3ds2) in both direct & redirect checkout flows and APMs (PayPal, Klarna - Pay Now, Pay Later & Slice It) checkout flows. 
