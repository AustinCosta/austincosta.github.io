(function(window, undefined) {
  var dictionary = {
    "da8410c9-9f55-4535-a5fb-be1d5522a3c6": "Transport",
    "47cfb2f0-1a07-4968-9a07-7cdf41ad109b": "FAQ",
    "23d5f274-0cfb-4250-a469-6c22c2a2c847": "Entertainment",
    "e69944d8-8376-43de-8ec1-b12e87b74598": "Food",
    "18e93c1e-7171-4594-a888-98ac08e17037": "Lodging",
    "8b28e3a5-4d12-4930-930c-5d3d7a6e90fd": "Sights",
    "d12245cc-1680-458d-89dd-4f0d7fb22724": "Home Page",
    "f39803f7-df02-4169-93eb-7547fb8c961a": "Template 1",
    "bb8abf58-f55e-472d-af05-a7d1bb0cc014": "default"
  };

  var uriRE = /^(\/#)?(screens|templates|masters|scenarios)\/(.*)(\.html)?/;
  window.lookUpURL = function(fragment) {
    var matches = uriRE.exec(fragment || "") || [],
        folder = matches[2] || "",
        canvas = matches[3] || "",
        name, url;
    if(dictionary.hasOwnProperty(canvas)) { /* search by name */
      url = folder + "/" + canvas;
    }
    return url;
  };

  window.lookUpName = function(fragment) {
    var matches = uriRE.exec(fragment || "") || [],
        folder = matches[2] || "",
        canvas = matches[3] || "",
        name, canvasName;
    if(dictionary.hasOwnProperty(canvas)) { /* search by name */
      canvasName = dictionary[canvas];
    }
    return canvasName;
  };
})(window);