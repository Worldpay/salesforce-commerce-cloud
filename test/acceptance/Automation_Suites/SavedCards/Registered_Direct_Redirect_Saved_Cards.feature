Feature: Direct/Redirect OrderPlacement Saved CC
    As a shopper, I want to add a 3DS2 CC and save into My Account Payment and place the order with the saved 3DS2 CC in Direct/Redirect Payment Method using Disclaimer Save option and Delete it.
	
@Registered_DirectOrder_SavedCard
    Scenario: Registered User is able to place order via 3DS2 Saved Card under My Account Payment in Direct Payment Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
		Then Shopper Click on Add New Payment
		And User add a new card details in Account
		|Name on Card |Card Number |Expiration Month|Expiration Year|
		|3DS_V1_CHALLENGE_IDENTIFIED|5163613613613613|01|2022|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|code1auto1@yopmail.com|(33) 1 43 12 48 65|
		Then User fills cvv for Saved card
		|cvv|
		|545|
		Then User Click on Next Place Order Button
		Then User Click on Place Order
		Then User Click on Ok Button in 3DS Challenge Window
		And Apm Print the Order Number
        |Registered Direct Saved Card|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 


@Registered_RedirectOrder_SavedCard
    Scenario: Registered User is able to place order via Normal Saved Card under My Account Payment in Redirect Payment Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
		Then Shopper Click on Add New Payment
		And User add a new card details in Account
		|Name on Card |Card Number |Expiration Month|Expiration Year|
		|auto code|5163613613613613|01|2022|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
		And User fills email and phone number and click on Add Payment Button
			|email|phoe no.|
			|code1auto1@yopmail.com|(33) 1 43 12 48 65|
		And Select Redierct Mode on payment Page
        Then User selects the saved card
        Then User Click on Next Place Order Button 
		Then User Click on Place Order
		Then User fills cvv for saved card on hpp
		|cvv|
		|545|
		And Apm Print the Order Number
        |Registered Redirect Saved Card|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 
		



		 

