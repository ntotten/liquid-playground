import * as monaco from "monaco-editor";
import { Liquid } from "liquidjs";
import PLAY_SAMPLES from "./samples/basics";
import "./styles.css";

var isMac = /Mac/i.test(navigator.userAgent);

var editor = null;
var runEditor = null;
var data = {
  json: {
    model: null,
    state: null,
  },
  html: {
    model: null,
    state: null,
  },
};

function load() {
  function layout() {
    var GLOBAL_PADDING = 20;

    var WIDTH = window.innerWidth - 2 * GLOBAL_PADDING;
    var HEIGHT = window.innerHeight;

    var TITLE_HEIGHT = 110;
    var FOOTER_HEIGHT = 80;
    var TABS_HEIGHT = 20;
    var INNER_PADDING = 20;
    var SWITCHER_HEIGHT = 30;

    var HALF_WIDTH = Math.floor((WIDTH - INNER_PADDING) / 2);
    var REMAINING_HEIGHT =
      HEIGHT - TITLE_HEIGHT - FOOTER_HEIGHT - SWITCHER_HEIGHT;

    playgroundContainer.style.width = WIDTH + "px";
    playgroundContainer.style.height = HEIGHT - FOOTER_HEIGHT + "px";

    sampleSwitcher.style.position = "absolute";
    sampleSwitcher.style.top = TITLE_HEIGHT + "px";
    sampleSwitcher.style.left = GLOBAL_PADDING + "px";

    typingContainer.style.position = "absolute";
    typingContainer.style.top =
      GLOBAL_PADDING + TITLE_HEIGHT + SWITCHER_HEIGHT + "px";
    typingContainer.style.left = GLOBAL_PADDING + "px";
    typingContainer.style.width = HALF_WIDTH + "px";
    typingContainer.style.height = REMAINING_HEIGHT + "px";

    tabArea.style.position = "absolute";
    tabArea.style.boxSizing = "border-box";
    tabArea.style.top = 0;
    tabArea.style.left = 0;
    tabArea.style.width = HALF_WIDTH + "px";
    tabArea.style.height = TABS_HEIGHT + "px";

    editorContainer.style.position = "absolute";
    editorContainer.style.boxSizing = "border-box";
    editorContainer.style.top = TABS_HEIGHT + "px";
    editorContainer.style.left = 0;
    editorContainer.style.width = HALF_WIDTH + "px";
    editorContainer.style.height = REMAINING_HEIGHT - TABS_HEIGHT + "px";

    if (editor) {
      editor.layout({
        width: HALF_WIDTH - 2,
        height: REMAINING_HEIGHT - TABS_HEIGHT - 1,
      });
    }

    previewContainer.style.position = "absolute";
    previewContainer.style.top =
      GLOBAL_PADDING + TITLE_HEIGHT + SWITCHER_HEIGHT + "px";
    previewContainer.style.left =
      GLOBAL_PADDING + INNER_PADDING + HALF_WIDTH + "px";
    previewContainer.style.width = HALF_WIDTH + "px";
    previewContainer.style.height = REMAINING_HEIGHT + "px";

    previewTabArea.style.position = "absolute";
    previewTabArea.style.boxSizing = "border-box";
    previewTabArea.style.top = 0;
    previewTabArea.style.left = 0;
    previewTabArea.style.width = HALF_WIDTH + "px";
    previewTabArea.style.height = TABS_HEIGHT + "px";

    runContainer.style.position = "absolute";
    runContainer.style.boxSizing = "border-box";
    runContainer.style.top = TABS_HEIGHT + "px";
    runContainer.style.left = 0;
    runContainer.style.width = HALF_WIDTH + "px";
    runContainer.style.height = REMAINING_HEIGHT - TABS_HEIGHT + "px";

    iframeContainer.style.position = "absolute";
    iframeContainer.style.boxSizing = "border-box";
    iframeContainer.style.top = TABS_HEIGHT + "px";
    iframeContainer.style.left = 0;
    iframeContainer.style.width = HALF_WIDTH + "px";
    iframeContainer.style.height = REMAINING_HEIGHT - TABS_HEIGHT + "px";

    if (runEditor) {
      runEditor.layout({
        width: HALF_WIDTH - 2,
        height: REMAINING_HEIGHT - TABS_HEIGHT - 1,
      });
    }
  }

  function changeTab(selectedTabNode, desiredModelId) {
    for (var i = 0; i < tabArea.childNodes.length; i++) {
      var child = tabArea.childNodes[i];
      if (/tab/.test(child.className)) {
        child.className = "tab";
      }
    }
    selectedTabNode.className = "tab active";

    var currentState = editor.saveViewState();

    var currentModel = editor.getModel();
    if (currentModel === data.json.model) {
      data.json.state = currentState;
    } else if (currentModel === data.html.model) {
      data.html.state = currentState;
    }

    editor.setModel(data[desiredModelId].model);
    editor.restoreViewState(data[desiredModelId].state);
    editor.focus();
  }

  function changePreviewTab(selectedTabNode, desiredTabName) {
    for (var i = 0; i < previewTabArea.childNodes.length; i++) {
      var child = previewTabArea.childNodes[i];
      if (/tab/.test(child.className)) {
        child.className = "tab";
      }
    }
    selectedTabNode.className = "tab active";

    if (desiredTabName === "html") {
      iframeContainer.style.display = "none";
      runContainer.style.display = "block";
    } else if (desiredTabName === "preview") {
      iframeContainer.style.display = "block";
      runContainer.style.display = "none";
    }
  }

  // create the typing side
  var typingContainer = document.createElement("div");
  typingContainer.className = "typingContainer";

  var tabArea = (function () {
    var tabArea = document.createElement("div");
    tabArea.className = "tabArea";

    var htmlTab = document.createElement("span");
    htmlTab.className = "tab active";
    htmlTab.appendChild(document.createTextNode("HTML"));
    htmlTab.onclick = function () {
      changeTab(htmlTab, "html");
    };
    tabArea.appendChild(htmlTab);

    var jsonTab = document.createElement("span");
    jsonTab.className = "tab";
    jsonTab.appendChild(document.createTextNode("JSON"));
    jsonTab.onclick = function () {
      changeTab(jsonTab, "json");
    };
    tabArea.appendChild(jsonTab);

    var runLabel =
      "Press " +
      (isMac ? "CMD + return" : "CTRL + Enter") +
      " to run the code.";
    var runBtn = document.createElement("button");
    runBtn.className = "action run";
    runBtn.setAttribute("role", "button");
    runBtn.setAttribute("aria-label", runLabel);
    runBtn.appendChild(document.createTextNode("Run"));
    runBtn.onclick = function () {
      run();
    };
    tabArea.appendChild(runBtn);

    var shareBtn = document.createElement("button");
    shareBtn.className = "action share";
    shareBtn.setAttribute("role", "button");
    shareBtn.setAttribute("aria-label", runLabel);
    shareBtn.appendChild(document.createTextNode("Share"));
    shareBtn.onclick = function () {
      share();
    };
    tabArea.appendChild(shareBtn);

    return tabArea;
  })();

  var editorContainer = document.createElement("div");
  editorContainer.className = "editor-container";

  typingContainer.appendChild(tabArea);
  typingContainer.appendChild(editorContainer);

  // create the preview side
  var previewContainer = document.createElement("div");
  previewContainer.className = "previewContainer";

  var previewTabArea = (function () {
    var previewTabArea = document.createElement("div");
    previewTabArea.className = "tabArea";

    var htmlTab = document.createElement("span");
    htmlTab.className = "tab active";
    htmlTab.appendChild(document.createTextNode("HTML"));
    htmlTab.onclick = function () {
      changePreviewTab(htmlTab, "html");
    };
    previewTabArea.appendChild(htmlTab);

    var previewTab = document.createElement("span");
    previewTab.className = "tab";
    previewTab.appendChild(document.createTextNode("Preview"));
    previewTab.onclick = function () {
      changePreviewTab(previewTab, "preview");
    };
    previewTabArea.appendChild(previewTab);

    return previewTabArea;
  })();

  var runContainer = document.createElement("div");
  runContainer.className = "run-container";

  var iframeContainer = document.createElement("iframe");
  iframeContainer.className = "iframe-container";
  iframeContainer.style = "display: none;";
  iframeContainer.src = "samples/preview.html";

  previewContainer.appendChild(previewTabArea);
  previewContainer.appendChild(runContainer);
  previewContainer.appendChild(iframeContainer);

  var sampleSwitcher = document.createElement("select");
  var sampleChapter;
  PLAY_SAMPLES.forEach(function (sample) {
    if (!sampleChapter || sampleChapter.label !== sample.chapter) {
      sampleChapter = document.createElement("optgroup");
      sampleChapter.label = sample.chapter;
      sampleSwitcher.appendChild(sampleChapter);
    }
    var sampleOption = document.createElement("option");
    sampleOption.value = sample.id;
    sampleOption.appendChild(document.createTextNode(sample.name));
    sampleChapter.appendChild(sampleOption);
  });
  sampleSwitcher.className = "sample-switcher";

  var LOADED_SAMPLES = [];
  function findLoadedSample(sampleId) {
    for (var i = 0; i < LOADED_SAMPLES.length; i++) {
      var sample = LOADED_SAMPLES[i];
      if (sample.id === sampleId) {
        return sample;
      }
    }
    return null;
  }

  function findSamplePath(sampleId) {
    for (var i = 0; i < PLAY_SAMPLES.length; i++) {
      var sample = PLAY_SAMPLES[i];
      if (sample.id === sampleId) {
        return sample.path;
      }
    }
    return null;
  }

  function loadSample(sampleId, callback) {
    var sample = findLoadedSample(sampleId);
    if (sample) {
      return callback(null, sample);
    }

    var samplePath = findSamplePath(sampleId);
    if (!samplePath) {
      return callback(new Error("sample not found"));
    }

    samplePath = "/samples/" + samplePath;

    var json = xhr(samplePath + "/sample.json").then(function (response) {
      return response.responseText;
    });
    var html = xhr(samplePath + "/sample.html").then(function (response) {
      return response.responseText;
    });
    Promise.all([json, html]).then(
      function (_) {
        var json = _[0];
        var html = _[1];
        LOADED_SAMPLES.push({
          id: sampleId,
          json: json,
          html: html,
        });
        return callback(null, findLoadedSample(sampleId));
      },
      function (err) {
        callback(err, null);
      }
    );
  }

  sampleSwitcher.onchange = function () {
    var sampleId = sampleSwitcher.options[sampleSwitcher.selectedIndex].value;
    window.location.hash = sampleId;
  };

  var playgroundContainer = document.getElementById("playground");

  layout();
  window.onresize = layout;

  playgroundContainer.appendChild(sampleSwitcher);
  playgroundContainer.appendChild(typingContainer);
  playgroundContainer.appendChild(previewContainer);

  data.json.model = monaco.editor.createModel("{ }", "json");
  data.html.model = monaco.editor.createModel("html", "html");

  editor = monaco.editor.create(editorContainer, {
    model: data.json.model,
    minimap: {
      enabled: false,
    },
  });

  runEditor = monaco.editor.create(runContainer, {
    minimap: {
      enabled: false,
    },
  });

  function loadGistFromHash(gistId) {
    xhr("https://api.github.com/gists/" + gistId)
      .then(function (response) {
        var gist = JSON.parse(response.responseText);
        var html = gist.files["sample.html"].content;
        var json = gist.files["sample.json"].content;
        data.json.model.setValue(json);
        data.html.model.setValue(html);
        editor.setScrollTop(0);
        run();
      })
      .catch(console.error);
  }

  function loadContentFromHash(content) {
    var json = atob(content);
    var model = JSON.parse(json);
    data.json.model.setValue(model.json);
    data.html.model.setValue(model.html);
    editor.setScrollTop(0);
    run();
  }

  function loadSampleFromHash(firstTime, sampleId) {
    if (!sampleId) {
      sampleId = PLAY_SAMPLES[0].id;
    }

    if (firstTime) {
      for (var i = 0; i < sampleSwitcher.options.length; i++) {
        var opt = sampleSwitcher.options[i];
        if (opt.value === sampleId) {
          sampleSwitcher.selectedIndex = i;
          break;
        }
      }
    }

    var myToken = ++currentToken;
    loadSample(sampleId, function (err, sample) {
      if (err) {
        alert("Sample not found! " + err.message);
        return;
      }
      if (myToken !== currentToken) {
        return;
      }
      data.json.model.setValue(sample.json);
      data.html.model.setValue(sample.html);
      editor.setScrollTop(0);
      run();
    });
  }

  var currentToken = 0;
  function parseHash(firstTime) {
    var hash = window.location.hash.replace(/^#/, "");
    if (hash.indexOf("c=") === 0) {
      return loadContentFromHash(hash.substr(2));
    } else if (hash.indexOf("g=") === 0) {
      return loadGistFromHash(hash.substr(2));
    } else {
      return loadSampleFromHash(firstTime, hash);
    }
  }
  window.onhashchange = parseHash;
  parseHash(true);

  function handleLiquidError(error) {
    console.error(error);
    writePreview(error.stack, "error");
  }

  function writePreview(code, html) {
    var model = monaco.editor.createModel(code, "html");
    runEditor.setModel(model);
    var doc = iframeContainer.contentWindow.document;
    doc.open();
    doc.write(html || code);
    doc.close();
  }

  function share() {
    var c = {
      html: data.html.model.getValue(),
      json: data.json.model.getValue(),
    };
    var hash = btoa(JSON.stringify(c));
    window.location.hash = "c=" + hash;
  }

  function run() {
    const engine = new Liquid();
    let tpl;
    try {
      tpl = engine.parse(data.html.model.getValue());
    } catch (err) {
      handleLiquidError(err);
    }
    let v;
    try {
      v = JSON.parse(data.json.model.getValue());
    } catch (err) {
      handleLiquidError(err);
    }

    if (tpl && v) {
      engine.render(tpl, v).then(writePreview).catch(handleLiquidError);
    }
  }

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run);
  window.addEventListener("keydown", function keyDown(ev) {
    if ((isMac && !ev.metaKey) || !ev.ctrlKey) {
      return;
    }

    if (ev.shiftKey || ev.altKey || ev.keyCode !== 13) {
      return;
    }

    ev.preventDefault();
    run();
  });
}

var preloaded = {};
var elements = Array.prototype.slice.call(
  document.querySelectorAll("pre[data-preload]"),
  0
);

elements.forEach(function (el) {
  var path = el.getAttribute("data-preload");
  preloaded[path] = el.innerText || el.textContent;
  el.parentNode.removeChild(el);
});
load();

function xhr(url) {
  if (preloaded[url]) {
    return Promise.resolve({
      responseText: preloaded[url],
    });
  }

  var req = null;
  return new Promise(
    function (c, e) {
      req = new XMLHttpRequest();
      req.onreadystatechange = function () {
        if (req._canceled) {
          return;
        }

        if (req.readyState === 4) {
          if ((req.status >= 200 && req.status < 300) || req.status === 1223) {
            c(req);
          } else {
            e(req);
          }
          req.onreadystatechange = function () {};
        }
      };

      req.open("GET", url, true);
      req.responseType = "";

      req.send(null);
    },
    function () {
      req._canceled = true;
      req.abort();
    }
  );
}
