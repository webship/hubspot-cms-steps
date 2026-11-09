# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: Pricing page
  As a prospective customer
  I want to compare pricing tiers
  So that I can choose the right plan

  Background:
    Given I am on "/pricing.html"

  Scenario: Pricing page is served by HubSpot
    Then the page should be a HubSpot page
    And I should see "Simple, transparent pricing"

  Scenario: Every tier has a working CTA
    Then the HubSpot CTA "Get Started" should link to "/contact-us.html"
    And the HubSpot CTA "Start Free Trial" should link to "/contact-us.html"
    And the HubSpot CTA "Talk to Sales" should link to "/contact-us.html"

  Scenario: Clicking a pricing CTA goes to the contact page
    When I click the HubSpot CTA "Start Free Trial"
    Then I should be on "/contact-us.html"
