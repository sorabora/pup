ace.define(
  "ace/mode/pup_highlight_rules",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text_highlight_rules",
  ],
  function (require, exports) {
    const oop = require("ace/lib/oop");
    const TextHighlightRules =
      require("ace/mode/text_highlight_rules").TextHighlightRules;

    const PupHighlightRules = function () {
      this.$rules = {
        start: [
          {
            token: "comment",
            regex: "\\/\\/.*$",
          },
          {
            token: "comment",
            regex: "\\/\\*",
            next: "blockComment",
          },
          {
            token: "keyword",
            regex: "\\b(?:include|local|if|else|switch|case|default|while|for|end|and|or|function|return|new|ssr|htmlapp)\\b",
          },
          {
            token: "support.function",
            regex: "\\b(?:print|ask|dialog|wait|eval|restart|toString|toNumber|toBool|isKeyDown|isKeyPressed|createEnum|center|left|right|request|response|setProperty|setHtmlAttribute|getProperty|getHtmlAttribute)\\b",
          },
          {
            token: "storage.type",
            regex: "\\b(?:any|int|double|bigint|string|boolean|object|array|Vector2|Vector3|Enum|__internals)\\b",
          },
          {
            token: "constant.language",
            regex: "\\b(?:true|false)\\b",
          },
          {
            token: "constant.numeric",
            regex: "\\b[0-9]+(?:\\.[0-9]+)?\\b",
          },
          {
            token: "string",
            regex: '".*?"',
          },
        ],
        blockComment: [
          {
            token: "comment",
            regex: "\\*\\/",
            next: "start",
          },
          {
            token: "comment",
            regex: ".",
          },
        ],
      };
      this.normalizeRules();
    };

    oop.inherits(PupHighlightRules, TextHighlightRules);
    exports.PupHighlightRules = PupHighlightRules;
  },
);

ace.define(
  "ace/mode/pup",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text",
    "ace/mode/pup_highlight_rules",
  ],
  function (require, exports) {
    const oop = require("ace/lib/oop");
    const TextMode = require("ace/mode/text").Mode;
    const PupHighlightRules =
      require("ace/mode/pup_highlight_rules").PupHighlightRules;

    const Mode = function () {
      this.HighlightRules = PupHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function () {
      this.$id = "ace/mode/pup";
    }).call(Mode.prototype);

    exports.Mode = Mode;
  },
);
