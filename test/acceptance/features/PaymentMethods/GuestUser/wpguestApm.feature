Feature: Add Product To Cart
    As a shopper, I want to search for a product and add it to cart


@Paypal
    Scenario: Registered Shopper is able to place order via Paypal
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
         And Apm selects color
        When Apm he adds the product to cart
        Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|CN|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for paypal
        |email|phone|country|
        |admin@gmail.com|3333333333|US|
        And Apm Print the Order Number

@Sofort
    Scenario: Registered Shopper is able to place order via Sofort
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
       Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and country for sofort
        |email|phone|country|
        |admin@gmail.com|3333333333|BE|
        And Apm Print the Order Number
@Wechatpay
    Scenario: Registered Shopper is able to place order via Wechatpay
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
       Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|BE|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number for wechatpay
        |email|phone|
        |admin@gmail.com|3333333333|
        And Apm Print the Order Number
@Alipay
    Scenario: Registered Shopper is able to place order via Alipay
        When Apm shopper selects yes or no for tracking consent
        Given Apm Shopper searches for "Turquoise and Gold Bracelet"
        And Apm selects color
        When Apm he adds the product to cart
       Then User clicks on checkout as guest
        And Apm Shopper fills shipping Address
        |firstName|lastName|addressOne|addressTwo|country|state|city|zipCode|phone|
        |Nishikant|Singh|4014  Frederick Street|street|US|AL|El Paso|12345|3333333333|
        And Apm Shopper fills email and phone number and status for alipay
        |email|phone|status|country|
        |admin@gmail.com|3333333333|PENDINGOPEN|CN|
        And Apm Print the Order Number
        
        
        
      
        
      