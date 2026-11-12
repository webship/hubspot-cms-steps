# Read-only checks against a public site built on HubSpot CMS: the form steps on a
# raw HTML form, the cookie consent, the tracking code, language alternates and
# the language switcher. Nothing is sent: a form submitted empty is stopped by the
# browser-side validation. `npm run test:real-sites` runs this file with
# LAUNCH_URL=https://huble.com (the host is the file name); the default run
# leaves the @real-site tag out, because the pages belong to third parties and
# change.
@real-site
Feature: HubSpot steps on a public site
  As a tester of a HubSpot CMS site
  I want the form steps to work on the markup HubSpot really renders
  So that I can trust them on my own site

  Scenario: A raw HTML form shows its validation errors when it is submitted empty
    Given I am on "/contact-us"
    Then the page should be a HubSpot page
    And the page should have a HubSpot form
    And the HubSpot form should have a field "email"
    And the HubSpot form should have a field "firstname"
    And the HubSpot form field "email" should be required
    When I submit the HubSpot form
    Then the HubSpot form field "firstname" should show an error containing "Please complete this required field."
    And the HubSpot form field "email" should show an error
    And the HubSpot form should show an error containing "Please complete all required fields."
    And the HubSpot form should not show a success message

  Scenario: The cookie banner is answered and the choice is saved
    Given I am on "/blog"
    Then the HubSpot cookie banner should be visible
    And the HubSpot cookie consent should not be saved
    When I decline the HubSpot cookie banner
    Then the HubSpot cookie banner should not be visible
    And the HubSpot cookie consent should be declined

  Scenario: A scenario can start with the cookie consent answered
    Given the HubSpot cookie consent is accepted
    And I am on "/blog"
    Then the HubSpot cookie consent should be accepted

  Scenario: The page loads the tracking code and declares its translations
    Given I am on "/"
    Then the HubSpot tracking code should be installed for portal "213255"
    And the HubSpot tracking code should not be installed for portal "1"
    And the page should have a HubSpot language switcher
    And the page should be available in the language "de"
    And the page should be available in the language "fr"
    And the page should not be available in the language "ja"
    And the page should have the canonical address "/"
    And the page should not be hidden from search engines
