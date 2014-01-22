stoic-ods
==========

Importer: turn an ods into stoic's internal json format:
```json
{
  name: 'spreadsheetName'
  timezone: '',
  ...
  "sheets": {
    "Fields": {
      "values": [
        [
          "A1 ...",
          "B1 ..."
        ],
      },
      "numberFormats": [
        [  ]
      ],
      "notes": [
        [ "text of the comments on A1", "..." ]
      ],
    }
}
```
Exporter: turn a json into an ods
