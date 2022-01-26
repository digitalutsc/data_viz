<?php

namespace Drupal\data_viz\Tests;

use Drupal\simpletest\WebTestBase;

/**
 * Provides automated tests for the data_viz module.
 */
class DefaultControllerTest extends WebTestBase {


  /**
   * {@inheritdoc}
   */
  public static function getInfo() {
    return [
      'name' => "data_viz DefaultController's controller functionality",
      'description' => 'Test Unit for module data_viz and controller DefaultController.',
      'group' => 'Other',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function setUp() {
    parent::setUp();
  }

  /**
   * Tests data_viz functionality.
   */
  public function testDefaultController() {
    // Check that the basic functions of module data_viz.
    $this->assertEquals(TRUE, TRUE, 'Test Unit Generated via Drupal Console.');
  }

}
