# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
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

  Scenario: A CTA made of an image is found by its alternative text
    Then the HubSpot CTA "Download the guide" should be visible
    And the HubSpot CTA "Download the guide" should link to "/blog/hubspot-cms-tips.html"

  Scenario: The new CTA embed is found as well
    Then the HubSpot CTA "Read the blog" should link to "/blog/"
