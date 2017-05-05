# Worldpays Salesforce Commerce Cloud Cartridge

Adding the Cartridges in Demandware Studio

To upload the cartridges into the Demandware server you first need to add the cartridges into
Demandware studio. In order to do this, follow these instructions:

- In Demandware UXStudio select in the menu File  Import.
- In the import dialog select General  Existing projects in the workspace and click next
- Ensure Select archive file is selected and select the compressed cartridge file by clicking on the Browse button.
- Click Finish to import the cartridge.

Studio will now ask you if you want to link the cartridge to your active Demandware server
connection. Click on yes or manually link the cartridge to your server by checking the project
under project references in the server connection properties.

Activating the Cartridges in Business Manager
Before the WorldPay functionality can become available to SiteGenesis, the cartridges have to be added to
the cartridge path of the Site in question. In order to do this, follow the following instructions:

- Log into Business Manager
- Navigate to Administration  Sites  Manage Sites.
- Click on the site name and on the next page go to the Settingstab.
- In the textbox Cartridges append to the end “:int_worldpay” and if controllers required then append “:int_worldpay_controllers” before Int_worldpay cartridge inclusion
- Click Apply.
- To activate the cartridge for the Sandbox/Development/Production instances repeat steps 4 and 5 after selecting the appropriate instance from the Instance Type dropdown menu.
- Repeat steps 3 to 6 for each site that is to use Worldpay.
- To run the Job in worldpay cartridge,Navigate to Administration  Sites  Manage Sites.
- Go to “Manage the Business Manager site”
- In the textbox Cartridges append to the end: “:int_worldpay”.

For detailed steps on how to configure the cartridge with your Worldpay account visit the integration guide
