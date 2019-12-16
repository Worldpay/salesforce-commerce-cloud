Feature: DirectOrderPlacement
    As a shopper, I want to place an order with Direct Payment Method

 @DirectOrder_MasterCard
    Scenario: Guest User is able to place order via Master Card in Direct Method
    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Shirt"
		Then Verify that Shirt Displayed in URL
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then User clicks on checkout as guest
		Then Verify that user has navigated to Shipping Page
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then Guest User add a new Master card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Nitin Satyajeet|5454545454545454|02|2022|545|
		Then Verify that added card should be Master Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number



@DirectOrder_AmexCard
Scenario: Guest User is able to place order via Amex Card in Direct Method

    	Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Shirt"
		Then Selects size "15L"
		Then User add the product to cart and click to Checkout
		Then User clicks on checkout as guest
		Then Select Country "UnitedStates"
		Then Select State "California"
		And Fill the Shipping address
			|firstName|lastName|streetAddress1|streetAddress2|city|postalCode|phoneNumber|
			|Test|QA|27 RUE PASTEUR|52 RUE DES FLEURS|CABOURG|14390|(33) 1 43 12 48 65 | 
		And User fills email and phone number and click on Add Payment Button
			|email|password|
			|nsat@yahoo.com|(33) 1 43 12 48 65|
		Then Guest User add a new Amex card details
			|Email|Phone Number |Name on Card |Card Number |Expiration Month|Expiration Year|Security Code|
			|nsat@yahoo.com|3333333333|Nitin Satyajeet|34343434343434|02|2022|5456|
		Then Verify that added card should be Amex Card
		Then User Click on Next Place Order Button
		Then Click on Place Order and print Order Number
		And Print the Order Number





