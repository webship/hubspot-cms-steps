# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Cookie consent
  As a visitor
  I want to choose which cookies a site may use
  So that my choice is respected on every page

  Scenario: Visitor can accept the cookie banner
    Given I am on "/index.html"
    Then the cookie banner should be visible
    And the cookie consent should not be saved
    When I accept the cookie banner
    Then the cookie banner should not be visible
    And the cookie consent should be accepted
    And the cookie consent should be saved

  Scenario: Visitor can decline the cookie banner
    Given I am on "/index.html"
    Then the cookie banner should be visible
    When I decline the cookie banner
    Then the cookie banner should not be visible
    And the cookie consent should be declined
    And the cookie consent should not be accepted

  Scenario: Visitor can dismiss the banner without choosing
    Given I am on "/pricing.html"
    When I dismiss the cookie banner
    Then the cookie banner should not be visible
    And the cookie consent should not be saved

  Scenario: The choice is kept on the next page
    Given I am on "/index.html"
    When I accept the cookie banner
    And I click the menu link "Pricing"
    Then I should be on "/pricing.html"
    And the cookie banner should not be visible

  Scenario: A scenario can start with the banner already answered
    Given the cookie consent is accepted
    And I am on "/index.html"
    Then the cookie banner should not be visible
    And the cookie consent should be accepted
