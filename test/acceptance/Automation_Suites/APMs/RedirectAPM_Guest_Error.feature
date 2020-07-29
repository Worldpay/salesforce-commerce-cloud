Feature: Guest Redirect APMs Error - China Union Pay, Giropay, Klarna Pay now & Pay later, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, IDEAL, PayPal


@Chinaunionpay Refused
    Scenario: Guest Shopper is able to place order via Chinaunionpay
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
        |ChinaUnionPay Refused Guest|

        
@Giropay Refused
    Scenario: Guest Shopper is able to place order via giropay
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
        |giropay refused Guest|

@Klarna Pay Now CANCEL
    Scenario: Guest Shopper is able to place order via klarnapaynow
       When Apm shopper selects yes or no for uk tracking consent
       Then Shopper searches for "Hammered Gold Earrings"
       Then User add the product to cart and click to Checkout
       Then User clicks on checkout as guest
        And Apm Shopper fills uk shipping Address
        |firstName|lastName|addressOne|addressTwo|country|county|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna
        |email|phone|producttype|status|country|
        |code1auto1@yopmail.com|3333333333|KLARNA_PAYNOW-SSL|CANCEL|GB|
        And Apm verify for error scenerios
        |klarnapaynow CANCEL Guest|  


@Sofort PENDINGERROR
    Scenario: Guest Shopper is able to place order via Sofort
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
        |Sofort Guest PENDINGERROR|

@Boleto Pending PENDINGFAILURE
    Scenario: Guest Shopper is able to place order via Boleto
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
        |Boleto Guest PENDINGFAILURE|

@CashU PENDINGEXPIRED
    Scenario: Guest Shopper is able to place order via CashU
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
        |CashU Guest PENDINGEXPIRED|

@Mistercash CANCELLED
    Scenario: Guest Shopper is able to place order via Mistercash
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
        |Mistercash Guest CANCELLED|

@PRZELEWY24 CANCELLED
    Scenario: Guest Shopper is able to place order via przelewy24
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
        |przelewy24 Guest CANCELLED| 

@Poli PENDINGFAILURE
    Scenario: Guest Shopper is able to place order via poli
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
        |poli Guest PENDINGFAILURE| 

@QIWI PENDINGEXPIRED
    Scenario: Guest Shopper is able to place order via qiwi
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
        |qiwi Guest PENDINGEXPIRED|  

@Yandex CANCELLED
    Scenario: Guest Shopper is able to place order via yandex
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
        |yandex Guest CANCELLED| 

@Alipay CANCELLED
    Scenario: Guest Shopper is able to place order via Alipay
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
        |Alipay Guest CANCELLED|

@ENETS REFUSED
    Scenario: Guest Shopper is able to place order via enets
       Given shopper selects yes or no for tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for enets
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|SG|
        And Apm verify for error scenerios
        |enets REFUSED Guest|

@Klarna Pay Later REFUSED
    Scenario: Guest Shopper is able to place order via klarnapaylater
        When Apm shopper selects yes or no for uk tracking consent
    	Then Shopper searches for "Hammered Gold Earrings"
		Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills uk shipping Address
        |firstName|lastName|addressOne|addressTwo|country|county|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|GB|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for klarna
        |email|phone|producttype|status|country|
        |code1auto1@yopmail.com|3333333333|KLARNA_PAYLATER-SSL|REFUSED|GB|
        And Apm verify for error scenerios
        |klarnapaylater REFUSED Guest| 
