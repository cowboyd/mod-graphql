function ramll2graphqlType(type) {
  const map = {
    string: 'String',
    integer: 'Int',
    // More to follow
  };

  return map[type] || 'Unknown';
}


function gatherComments(api, _options) {
  const comments = [];

  ['title', 'version', 'protocols', 'baseUri'].forEach(tag => {
    comments.push([tag, api.attributes(tag).map(attr => attr.plainValue())]);
  });

  return comments;
}


function gatherResource(resource, level = 0, parentUri = '') {
  const result = { level };
  const rel = resource.attr('relativeUri').plainValue();
  const uri = parentUri + rel;
  // We will come back to pick up the types later

  const methods = resource.elementsOfKind('methods');
  // At this stage, we are only interested in GET, not mutations
  methods.filter(m => m.name() === 'get').forEach((method) => {
    const args = [];

    let basePath;
    if (rel.startsWith('/{')) {
      args.push([rel.replace(/\/{(.*)}/, '$1'), 'String', true]);
      basePath = `${parentUri}-SINGLE`;
    } else {
      basePath = uri;
    }

    method.elementsOfKind('queryParameters').forEach((qp) => {
      const a1 = qp.attr('required');
      const required = a1 ? a1.plainValue() : false;
      const a2 = qp.attr('type');
      const type = a2 ? a2.plainValue() : 'string';
      args.push([qp.name(), ramll2graphqlType(type), required]);
    });

    result.queryName = basePath.substr(1).replace('/', '-');
    result.args = args;
    const dna = resource.attr('displayName');
    if (dna) result.displayName = dna.plainValue();
  });

  result.subResources = [];
  resource.elementsOfKind('resources').forEach((sub) => {
    result.subResources.push(gatherResource(sub, level + 1, uri));
  });

  return result;
}


function flattenResources(resources) {
  const result = [];

  resources.forEach(resource => {
    const copy = Object.assign({}, resource);
    const subResources = copy.subResources;
    delete copy.subResources;
    if (copy.queryName) result.push(copy);
    const tmp = flattenResources(subResources);
    tmp.forEach(subResource => {
      result.push(subResource);
    });
  });

  return result;
}


function gatherResources(api, _options) {
  const resources = api.elementsOfKind('resources').map(r => gatherResource(r));
  return flattenResources(resources, _options);
}


function gatherAPI(api, _options) {
  return {
    comments: gatherComments(api, _options),
    resources: gatherResources(api, _options),
  }
}


exports.gatherAPI = gatherAPI;