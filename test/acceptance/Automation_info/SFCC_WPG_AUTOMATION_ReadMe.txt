Following are the pre-reqisites to run the codeceptjs automation suite for sfcc-wpg:
====================================================================================
CodeceptJS:
===========
1. Make sure to replace the "FileSystem.js" file present in the InstalledDir\node_modules\codeceptjs\lib\helper with the one present in the FileSytem folder.

Storefront:
===========
1. Make sure there exists user with username|password - |code1auto1@yopmail.com|Test@123|. If doesn't exists create an user with username|password - |code1auto1@yopmail.com|Test@123|.
2. Login with the above user and make sure there are no saved addresses & payments under my account.

SFCC BM:
========
1. Make sure Exemption Engine is turned off in Merchant Tools > Custom Preferences > Worldpay-SecureTransaction.
2. Make sure the inventory for PID: 013742333299 in MobileFirst and PID: 013742333299M in RefArch are perpetual. 
3. Make sure the Catridges is set to 'int_worldpay_sfra:int_worldpay_core:int_worldpay_csc:app_storefront_base' for MobileFirst and 'worldpay_sfra_changes:int_worldpay_sfra:int_worldpay_core:int_worldpay_csc:app_storefront_base' for RefArch in Administration >  Sites >  Manage Sites > 

codecept.conf (Path where "test" directory is present) & uriUrils (Path: test\acceptance\utils):
===============================================================================================
1. Make sure proper urls are configured in codecept.conf.js and uriUtils.js. Currently the automation is configured to run on MobileFirst with default Checkout UI and RefArch sites with Plugin Checkout UI.


How to run Automation:
=====================
1. Place the desired test suite folder from Automation_Suites under test/acceptance/features/PaymentMethods. Note: Please refer SFCC_WPG_CodeceptJS_Automation_Scenarios for automation scenarios info.
2. Run cmd/bash from root location where test folder resides with 'npm run test:acceptance' command.
3. Once Automation is complete Result.log file is generated on the path where "test" directory is present. This Result.log file contains Order Numbers and error messages of the automation passed scenarios.

How to generate Allure report:
==============================
1. Run cmd/bash from root location where test folder resides with 'npm run test:acceptance:launchReport' command.



