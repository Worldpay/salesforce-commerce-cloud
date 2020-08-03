Feature: Guest Direct APMs - AchPay, Konbini, Sepa & Wechatpay

@Wechatpay Auth.
    Scenario: Guest Shopper is able to place order via Wechatpay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number for wechatpay
        |email|phone|
        |code1auto1@yopmail.com|3333333333|
        And Apm Print the Order Number
        |Wechatpay Auth. Guest|

@Achpay Auth.
    Scenario: Guest Shopper is able to place order via Achpay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email, phone number, achpay details and status for achpay
        |email|phone|country|accounttype|routingnumber|accountnumber|checknumber|
        |code1auto1@yopmail.com|3333333333|US|Savings|123456789|12345678901234567|1234|
        And Apm Print the Order Number
        |Achpay Auth. Guest|


@Konbini Auth.
    Scenario: Guest Shopper is able to place order via konbini
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|JP|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number for konbini
        |email|phone|
        |code1auto1@yopmail.com|3333333333|
        And Apm Print the Order Number
        |konbini Auth. Guest|

@SEPA Auth.
    Scenario: Guest Shopper is able to place order via sepa
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|DE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for sepa
        |email|phone|iban|accountname|country|
        |code1auto1@yopmail.com|3333333333|DE93100000000012345678|test|DE|
        And Apm Print the Order Number
        |sepa Auth. Guest|    

