Feature: NUI Country Spoofing

@CountrySpoofing_Wechatpay_NUI
    Scenario: Guest Shopper is able to place an Wechatpay order with billing country Isle of Man (Pre-condition: Country Spoofing is on and IM is mapped to UK)
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|IM|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number for wechatpay
        |email|phone|
        |code1auto1@yopmail.com|3333333333|
        And Apm Print the Order Number
        |CountrySpoofing IM Wechatpay Auth. NUI Guest|

@CountrySpoofing_Chinaunionpay_NUI
    Scenario: Registered Shopper is able to place an chinaunionpay order with billing country Isle of Man (Pre-condition: Country Spoofing is on and IM is mapped to UK)
       Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper click on login button displaying on left header side
    	And Shopper fills the correct login details and click on Login Button
			|email|password|
			|code1auto1@yopmail.com|Test@123|
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|AUTHORISED|IM|
        And Apm Print the Order Number
        |CountrySpoofing IM ChinaUnionPay Auth. NUI Registered|
   
		
		
		
		
		
		
		
