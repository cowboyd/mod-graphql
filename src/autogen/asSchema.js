function renderResource(resource, level = 0, parentUri = '') {
  let output = '';
  const rel = resource.attr('relativeUri').plainValue();
  const uri = parentUri + rel;
  // We will come back to pick up the types later

  const methods = resource.elementsOfKind('methods');
  // At this stage, we are only interested in GET, not mutations
  methods.filter(m => m.name() === 'get').forEach((method) => {
    const args = [];

    let basePath;
    if (rel.startsWith('/{')) {
      args.push(rel.replace(/\/{(.*)}/, '$1'));
      basePath = parentUri;
    } else {
      basePath = uri;
    }

    const queryName = basePath.substr(1).replace('/', '-');
    output += '  '.repeat(level) + queryName;
    if (args.length > 0) {
      output += `(${args.join(', ')})`;
    }

    const dna = resource.attr('displayName');
    if (dna) {
      output += ` # ${dna.plainValue()}`;
    }

    output += '\n';
  });

  resource.elementsOfKind('resources').forEach((sub) => {
    output += renderResource(sub, level + 1, uri);
  });

  return output;
}


function render(api, _options) {
  let output = '';

  ['title', 'version', 'protocols', 'baseUri'].forEach(tag => {
    const values = api.attributes(tag).map(attr => attr.plainValue());
    output += `# ${tag}: ${values.join(', ')}\n`;
  });

  output += '\n' +
    'type Query {\n' +
    api.elementsOfKind('resources').map(r => renderResource(r)).join('') +
    '}\n';

  return output;
}


exports.render = render;
