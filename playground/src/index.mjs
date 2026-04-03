// Client-side rendering with Marko v6 DOM output
import example from './templates/example.marko';

async function render() {
  // The DOM output exports a template with mount method
  const template = example.default || example;

  // Use mount to attach to document body
  // The template has a .mount(input, reference, position) method
  const result = template.mount({}, document.body);

  return result;
}

render().catch(console.error);
