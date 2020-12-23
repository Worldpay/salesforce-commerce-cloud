Feature: Guest Redirect APMs Error - China Union Pay, Giropay, Klarna Pay now, Pay later & SliceIt, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, IDEAL, PayPal


@Chinaunionpay Refused
    Scenario: With -ve magic value Guest Shopper is unable to place order via Chinaunionpay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|CN|
        And Apm verify for error scenerios
        |ChinaUnionPay Refused. Guest|

        
@Giropay Refused
    Scenario: With -ve magic value Guest Shopper is unable to place order via giropay
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for giropay
        |email|phone|bankcode|status|country|
        |code1auto1@yopmail.com|3333333333|98765|REFUSED|DE|
        And Apm verify for error scenerios
        |giropay Refused. Guest|

@Klarna Pay Now CANCEL
    Scenario: With -ve magic value Guest Shopper is unable to place order via klarnapaynow
       Given shopper selects yes or no for tracking consent
       Then Shopper searches for "Hammered Gold Earrings"
       Then User add the product to cart and click to Checkout
       Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Now
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCEL|US|
        And Apm verify for error scenerios
        |klarnapaynow Cancel. Guest|  


@Sofort PENDINGERROR
    Scenario: With -ve magic value Guest Shopper is unable to place order via Sofort
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for sofort
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|AT|
        And Apm verify for error scenerios
        |Sofort PendingError. Guest|

@Boleto Pending PENDINGFAILURE
    Scenario: With -ve magic value Guest Shopper is unable to place order via Boleto
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email, phone number, cpf and status for boleto
        |email|phone|status|country|cpf|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|BR|263.946.533-30|
        And Apm verify for error scenerios
        |Boleto PendingFailure. Guest|

@CashU PENDINGEXPIRED
    Scenario: With -ve magic value Guest Shopper is unable to place order via CashU
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for cashu
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|AE|
        And Apm verify for error scenerios
        |CashU PendingExpired. Guest|

@Mistercash CANCELLED
    Scenario: With -ve magic value Guest Shopper is unable to place order via Mistercash
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for mistercash
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|BE|
        And Apm verify for error scenerios
        |Mistercash Cancelled. Guest|

@PRZELEWY24 CANCELLED
    Scenario: With -ve magic value Guest Shopper is unable to place order via przelewy24
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|PL|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for przelewy24
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|PL|
        And Apm verify for error scenerios
        |przelewy24 Cancelled. Guest| 

@Poli PENDINGFAILURE
    Scenario: With -ve magic value Guest Shopper is unable to place order via poli
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|NZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for poli
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|NZ|
        And Apm verify for error scenerios
        |poli PendingFailure. Guest| 

@Klarna Pay Later REFUSED
    Scenario: With -ve magic value Guest Shopper is unable to place order via klarnapaylater
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Pay Later
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|US|
        And Apm verify for error scenerios
        |klarnapaylater Refused. Guest| 

@QIWI PENDINGEXPIRED
    Scenario: With -ve magic value Guest Shopper is unable to place order via qiwi
         Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|KZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for qiwi
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|KZ|
        And Apm verify for error scenerios
        |qiwi PendingExpired. Guest|  

@Yandex CANCELLED
    Scenario: With -ve magic value Guest Shopper is unable to place order via yandex
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|RU|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for yandex
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|RU|
        And Apm verify for error scenerios
        |yandex Cancelled. Guest| 

@Alipay CANCELLED
    Scenario: With -ve magic value Guest Shopper is unable to place order via Alipay
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for alipay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|CN|
        And Apm verify for error scenerios
        |Alipay Cancelled. Guest|

@Klarna Slice IT ERROR
    Scenario: With -ve magic value Guest Shopper is unable to place order via klarnasliceit
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna Slice It
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|US|
        And Apm verify for error scenerios
        |klarnasliceit Error. Guest| 

@Ideal
    Scenario: With -ve magic value Guest Shopper is unable to place order via Ideal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for Ideal Cancel Scenario
        |email|phone|country|
        |code1auto1@yopmail.com|3333333333|BE|
        And Apm verify for error scenerios
        |Ideal Cancel. Guest|

@Paypal
    Scenario: With -ve magic value Guest Shopper is unable to place order via Paypal
        Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|response|
        |code1auto1@yopmail.com|3333333333|US|Fraud|
        And Apm verify for error scenerios
        |Paypal Fraud. Guest|