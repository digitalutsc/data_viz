<?php

namespace Drupal\data_viz\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;

use Drupal\file\Plugin\Field\FieldFormatter\FileFormatterBase;


/**
 * Plugin implementation of the 'data_viz_default' formatter.
 *
 * @FieldFormatter(
 *   id = "data_viz_default",
 *   label = @Translation("Show Diagram"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class NetworkFormatter extends FileFormatterBase {  
  /**
  * {@inheritdoc}
  */
  public static function defaultSettings() {
    return [
      // Declare a setting named 'diagram_type', with
      // a default value of 'Network'
      'diagram_type' => 'Network',
    ] + parent::defaultSettings();
  }

  /**
  * {@inheritdoc}
  */
  public function settingsForm(array $form, FormStateInterface $form_state) {

    $settings = $this->getSettings();

    $form['diagram_type'] = [
      '#title' => $this->t('Diagram Type'),
      '#type' => 'select',
      '#options' => [
        'Network' => $this->t('Network Diagram'),
        'Kinship' => $this->t('Kinship Diagram'),
      ],
      '#default_value' => $settings['diagram_type']
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = [];
    $settings = $this->getSettings();
    $summary[] = $this->t('Type: ') . $settings['diagram_type'];
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $element = [];
    $settings = $this->getSettings(); 

    if (!$items->isEmpty()) {
      foreach ($this->getEntitiesToView($items, $langcode) as $delta => $file) {
        $uri = $file->getFileUri();
        $url = \Drupal::service('file_url_generator')->generateAbsoluteString($uri);
        $element[$delta] = $this->addJsVar();
      }
      $element['#attached']['library'][] = 'data_viz/data_viz';
      $element['#attached']['drupalSettings']['data_viz']['path'] = $url;
      $element['#attached']['drupalSettings']['data_viz']['type'] = $settings['diagram_type'];
    }   
    
    return $element;
  }

  /**
   * add js-var markup to the element
   */
  private function addJsVar() {
    $render_array = [];
    $render_array['content'] = [
      '#type' => 'markup',
      '#markup' => '<div class="js-var"></div>'
    ];
    return $render_array;
  }
}

