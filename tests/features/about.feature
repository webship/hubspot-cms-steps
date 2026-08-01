Feature: About Us page
  As a visitor
  I want to learn about the company
  So that I can decide whether to trust it with my business

  Background:
    Given I am on "/about-us.html"

  Scenario: About page is served by HubSpot
    Then the page should be a HubSpot page
    And I should see "About Acme Analytics"

  Scenario: About page CTA goes to the contact page
    When I click the HubSpot CTA "Get in Touch"
    Then I should be on "/contact-us.html"
