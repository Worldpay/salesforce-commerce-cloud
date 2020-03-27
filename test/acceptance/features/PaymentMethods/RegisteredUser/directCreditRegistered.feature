Feature: DirectOrderPlacement
    As a shopper, I want to place an order with Direct Payment Method

 @DirectOrder_MasterCard
    Scenario: Registered User is able to place order via Master Card in Direct Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Verify that user has navigated to Shipping Page
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65|
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User add a new Master card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Nitin Satyajeet|5454545454545454|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number

@DirectOrder_MasterCard3ds
    Scenario: Registered User is able to place order via Master Card in Direct Method 3ds2
    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
		Then Verify that user has navigated to Shipping Page
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Gayathri|Vinoth|12 interpro road|52 RUE DES FLEURS|Alabama|12345|(33) 1 43 12 48 65|
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|sapient@gmail.com|(33) 1 43 12 48 65|
		Then User add a new Master card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|sapient@gmail.com|3333333333|3DS_V1_CHALLENGE_UNKNOWN_IDENTITY|5454545454545454|02|2022|545|
		Then User Click on Next Place Order Button
		Then User Click on Place Order
		Then User Click on Ok Button in 3DS Challenge Window
		And Print the Order Number


@DirectOrder_VisaCard
	Scenario: Registered User is able to place order via Visa Card in Direct Method

    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Verify that Shirt Displayed in URL
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User add a new Visa card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Nitin Satyajeet|4111111111111111|02|2022|545|
		Then Verify that added card should be Visa Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number


@DirectOrder_AmexCard
Scenario: Registered User is able to place order via Amex Card in Direct Method

    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User add a new Amex card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Nitin Satyajeet|34343434343434|02|2022|5456|
		Then Verify that added card should be Amex Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number






@DirectOrder_Master3DCard
Scenario: Registered User is able to place order via Amex Card in Direct Method

    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User should place an order with 3D MASTER CARD
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|3D|5454545454545454|02|2022|545|
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		Then Click on submit button on 3DS page
		And Print the Order Number



		


@DirectOrder_AmexCard_RefusedStatus
Scenario: Registered User is able to place order via Amex Card in Direct Method with Refused Status

    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User add a new Amex card details with Refused Status
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Refused|34343434343434|02|2022|5456|
		Then Verify that added card should be Amex Card
		Then User Click on Next Place Order Button
		Then Click on Place Order for error scenerios
		
		


@DirectOrder_AmexCard_CancelledStatus
Scenario: Registered User is able to place order via Amex Card in Direct Method with Cancelled Status

    	Given shopper selects yes or no for tracking consent
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|john@gmail.com|Abcd@1234|
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then User add a new Amex card details with Cancelled Status
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Cancelled|34343434343434|02|2022|5456|
		Then Verify that added card should be Amex Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number

		