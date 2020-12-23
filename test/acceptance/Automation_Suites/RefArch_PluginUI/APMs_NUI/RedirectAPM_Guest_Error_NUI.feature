Feature: NUI Guest Redirect APMs Error - China Union Pay, Giropay, Klarna Pay now, Pay later & SliceIt, Sofort, Boleto, CashU, Mistercash, PRZELEWY24, Poli, QIWI, IDEAL, PayPal


@Chinaunionpay Refused NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via Chinaunionpay
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for chinaunionpay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|REFUSED|CN|
        And Apm verify for NUI error scenerios
        |ChinaUnionPay Refused. NUI Guest|

        
@Giropay Refused NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via giropay
       Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for giropay
        |email|phone|bankcode|status|country|
        |code1auto1@yopmail.com|3333333333|98765|REFUSED|DE|
        And Apm verify for NUI error scenerios
        |giropay Refused NUI Guest|

@Sofort PENDINGERROR NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via Sofort
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and country for sofort
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGERROR|AT|
        And Apm verify for NUI error scenerios
        |Sofort PendingError. NUI Guest|

@Boleto Pending PENDINGFAILURE NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via Boleto
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email, phone number, cpf and status for boleto
        |email|phone|status|country|cpf|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|BR|263.946.533-30|
        And Apm verify for NUI error scenerios
        |Boleto PendingFailure. NUI Guest|

@CashU PENDINGEXPIRED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via CashU
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for cashu
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|AE|
        And Apm verify for NUI error scenerios
        |CashU PendingExpired. NUI Guest|

@Mistercash CANCELLED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via Mistercash
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for mistercash
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|BE|
        And Apm verify for NUI error scenerios
        |Mistercash Cancelled. NUI Guest|

@PRZELEWY24 CANCELLED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via przelewy24
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|PL|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for przelewy24
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|PL|
        And Apm verify for NUI error scenerios
        |przelewy24 Cancelled. NUI Guest| 

@Poli PENDINGFAILURE NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via poli
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|NZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for poli
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGFAILURE|NZ|
        And Apm verify for NUI error scenerios
        |poli PendingFailure. NUI Guest| 

@QIWI PENDINGEXPIRED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via qiwi
         Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|KZ|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for qiwi
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|PENDINGEXPIRED|KZ|
        And Apm verify for NUI error scenerios
        |qiwi PendingExpired. NUI Guest|  

@Yandex CANCELLED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via yandex
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|RU|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for yandex
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|RU|
        And Apm verify for NUI error scenerios
        |yandex Cancelled. NUI Guest| 

@Alipay CANCELLED NUI
    Scenario: With -ve magic value Guest Shopper is able to place order via Alipay
        Given shopper selects yes or no for tracking consent on refarch
    	Then Shopper searches for "Hammered Gold Earrings"
	    Then User add the product to cart and click to Checkout
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Code|Auto|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills new ui email and phone number and status for alipay
        |email|phone|status|country|
        |code1auto1@yopmail.com|3333333333|CANCELLED|CN|
        And Apm verify for NUI error scenerios
        |Alipay Cancelled. NUI Guest|



