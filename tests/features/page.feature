# The copy, labels and paths below are those of the demo site in demo-site/; swap
# them for your own content when you copy this feature.
Feature: What a HubSpot page loads and declares
  As a site owner
  I want the HubSpot features of a page to be in place
  So that tracking, chat, translations and search engines work as intended

  Scenario: The home page has the tracking code and the chat widget
    Given I am on "/index.html"
    Then the page should be a website page
    And the tracking code should be installed
    And the tracking code should be installed for portal "0000000"
    And the tracking code should not be installed for portal "1234567"
    And the chat widget should be present
    And the chat widget should be visible

  Scenario: A page without the chat script has no chat widget
    Given I am on "/pricing.html"
    Then the chat widget should not be present

  Scenario: The home page is available in German
    Given I am on "/index.html"
    Then the page should have a language switcher
    And the page should be available in the language "en"
    And the page should be available in the language "de"
    And the page should not be available in the language "ja"
    When I switch the language to "de"
    Then I should be on "/de/index.html"
    And the page language should be "de"
    And I should see "Machen Sie Website-Besucher zu Kunden"

  Scenario: A page without translations has no language switcher
    Given I am on "/pricing.html"
    Then the page should not have a language switcher
    And the page should not be available in the language "de"

  Scenario: The contact page embeds the meetings tool
    Given I am on "/contact-us.html"
    Then the page should have a meetings embed
    And the page should have a meetings embed for "/meetings/demo-sales-call"
    And the page should not have a meetings embed for "/meetings/someone-else"

  Scenario: The canonical address is declared
    Given I am on "/pricing.html"
    Then the page should have the canonical address "/pricing.html"
    And the page should not be hidden from search engines

  Scenario: A landing page can be hidden from search engines
    Given I am on "/thank-you.html"
    Then the page should be a landing page
    And the page should not be a website page
    And the page should be hidden from search engines
    And the page should have the canonical address "/thank-you.html"
