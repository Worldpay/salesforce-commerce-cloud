Following are the pre-reqisites to run the codeceptjs automation suite for sfcc-wpg:
====================================================================================
CodeceptJS:
===========
1. Make sure to replace the "FileSystem.js" file present in the InstalledDir\node_modules\codeceptjs\lib\helper with the one present in the FileSytem folder.
2. Make sure to place the result.txt file present in the result folder on the path where "test" directory is present.

Storefront:
===========
1. Make sure there exists user with username|password - |code1auto1@yopmail.com|Test@123|. If doesn't exists create an user with username|password - |code1auto1@yopmail.com|Test@123|.
2. Login with the above user and make sure there are no saved payments under my account.

SFCC BM:
========
1. Make sure Disclaimer feature is turned on and set to 'not mandatory' in the custom preferences.
2. Make sure Exemption Engine is turned off.

codecept.conf:
==============
1. Make sure proper url is configured for the HOST. 


How to run Automation:
1. Place the desired folder from Automation_Suites under test/acceptance/features/PaymentMethods.
2. Run cmd/bash from root location where test folder resides with 'npm run test:acceptance' command.
