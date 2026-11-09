const projects = [
  ["Automation", "What manual steps, inputs, and outputs are involved?", ["Scheduled runs", "File processing", "Exception alerts"], "What sample inputs and expected outputs can we test against?"],
  ["Custom web application", "What should someone be able to accomplish in the app?", ["User accounts", "Search and filters", "Notifications"], "Which user journey should the first release support end to end?"],
  ["Internal business tool", "What does your team use today, and where does it slow down?", ["Approval workflows", "Role-based access", "Reporting"], "Who can view, edit, and approve each record?"],
  ["API or software integration", "Which systems need to exchange data, and in which direction?", ["Data mapping", "Retry handling", "Sync monitoring"], "Do the systems offer documented APIs and test environments?"],
  ["Other software development", "Describe the current workflow and the outcome you want.", ["Data import/export", "Custom workflow", "Reporting"], "What is the smallest useful version you could test?"]
];
const state = { type: "", brief: {}, contact: {} };
const panel = document.querySelector("#panel");
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const list = (items, tag = "ul") => '<' + tag + '>' + items.map(x => '<li>' + escapeHTML(x) + '</li>').join("") + '</' + tag + '>';
const field = (name, label, value, options = {}) => {
  const { required = false, type = "text", hint = "", max = 160 } = options;
  const attrs = ' name="' + name + '" maxlength="' + max + '"' + (required ? ' required' : '') + (hint ? ' aria-describedby="' + name + '-hint"' : '');
  return '<label class="field">' + label + (hint ? '<br><small id="' + name + '-hint">' + hint + '</small>' : '') + (type === "area" ? '<textarea rows="3"' + attrs + '>' + escapeHTML(value) + '</textarea>' : '<input type="' + type + '"' + attrs + ' value="' + escapeHTML(value) + '"' + (["name","email","company"].includes(name) ? ' autocomplete="' + (name === "company" ? "organization" : name) + '"' : '') + '>') + '</label>';
};
const select = (name, label, value, items) => '<label class="field">' + label + '<select name="' + name + '" required><option value="">Choose an option</option>' + items.map(x => '<option' + (value === x ? ' selected' : '') + '>' + x + '</option>').join("") + '</select></label>';
const next = (label, back = false) => '<div class="actions">' + (back ? '<button type="button" data-back>Back</button>' : '') + '<button class="primary">' + label + ' →</button></div>';
function assess() {
  const { problem, users, features, extra, integration, systems, timeline } = state.brief;
  const project = projects[Number(state.type)];
  const connected = integration === "Yes";
  const score = features.length + Number(Boolean(extra)) + (connected ? 2 : 0) + (users === "Customers or public users" ? 2 : users === "Multiple teams" ? 1 : 0) + Number(state.type === "3");
  return {
    summary: project[0] + "\n" + problem + "\n\nUsers: " + users + "\nTimeline preference: " + timeline + "\nIntegration: " + integration + (connected && systems ? " — " + systems : ""),
    complexity: score >= 5 ? "High" : score >= 2 ? "Medium" : "Low",
    features: ["Core workflow for " + users.toLowerCase(), ...features, ...(extra ? [extra] : []), ...(connected ? ["Connection testing and failure recovery"] : [])],
    phases: ["Discovery — agree on scope and success criteria", "Prototype — test the primary workflow with sample data", ...(connected ? ["Integration — verify access, data mapping, and failure handling"] : []), "Delivery — validate edge cases and prepare handoff"],
    questions: [project[3], "What measurable result would make this project successful?", ...(integration !== "No" ? ["Which systems, access permissions, and data restrictions apply?"] : []), ...(timeline !== "Flexible / exploring" ? ["What drives the preferred timeline, and what can ship later?"] : [])]
  };
}
function render(step, focus = true) {
  document.querySelectorAll("#steps li").forEach((li, i) => i === step ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current"));
  const headings = ["What are you building?", "Tell us what it needs to do", "Your preliminary assessment", "Prepare your inquiry"];
  panel.innerHTML = '<p class="eyebrow">STEP 0' + (step + 1) + ' / 04</p><h3 tabindex="-1">' + headings[step] + '</h3><div id="body"></div>';
  const body = panel.querySelector("#body");
  const b = state.brief;
  if (step === 0) {
    body.innerHTML = '<form><fieldset><legend>Choose a project type</legend>' + projects.map(([name], i) => '<label class="choice"><input type="radio" required name="type" value="' + i + '"' + (state.type === String(i) ? " checked" : "") + '>' + name + '</label>').join("") + '</fieldset>' + next("Continue") + '</form>';
  } else if (step === 1) {
    const project = projects[Number(state.type)];
    body.innerHTML = '<form>' + field("problem", "What problem are you trying to solve?", b.problem, {required:true,type:"area",max:2000,hint:project[1]}) +
      select("users","Who will use it?",b.users,["Just me","One internal team","Multiple teams","Customers or public users","Still deciding"]) +
      '<fieldset><legend>Which features would help? (optional)</legend>' + project[2].map(x => '<label class="choice"><input type="checkbox" name="features" value="' + x + '"' + (b.features?.includes(x) ? " checked" : "") + '>' + x + '</label>').join("") + '</fieldset>' +
      field("extra","Other features (optional)",b.extra,{max:500}) +
      select("integration","Does it need to connect to existing software?",b.integration,["No","Yes","Unsure"]) +
      '<div id="systems">' + field("systems","Which software? (optional)",b.systems) + '</div>' +
      select("timeline","What is your approximate timeline?",b.timeline,["Within a month","In 1–3 months","In 3+ months","Flexible / exploring"]) + next("See assessment",true) + '</form>';
    const integration = body.querySelector('[name="integration"]');
    const toggle = () => { const show = integration.value === "Yes"; body.querySelector("#systems").hidden = !show; body.querySelector('[name="systems"]').disabled = !show; };
    integration.addEventListener("change",toggle);
    toggle();
  } else if (step === 2) {
    const a = assess();
    body.innerHTML = '<p class="muted">This assessment uses the scope you entered. Pricing and delivery dates are determined after discovery.</p><p><span class="badge">' + a.complexity + ' complexity</span></p>' +
      section("Project summary",'<p>' + escapeHTML(a.summary) + '</p>') +
      section("Recommended features",list(a.features)) + section("Potential development phases",list(a.phases,"ol")) +
      section("Questions to clarify",list(a.questions)) + '<div class="actions"><button type="button" data-back>Back</button><button type="button" class="primary" id="contact">Continue to contact →</button></div>';
    body.querySelector("#contact").onclick = () => render(3);
  } else {
    const c = state.contact;
    body.innerHTML = '<p class="muted">Download your completed brief, then email it to cole.dev to start a scoping conversation. The email button opens your email app. Attach the downloaded file and send your message there.</p><form>' +
      field("name","Name",c.name,{required:true}) + field("email","Email address",c.email,{required:true,type:"email",max:254}) +
      field("company","Company name (optional)",c.company) + field("details","Additional project details (optional)",c.details,{type:"area",max:2000}) +
      next("Download project brief",true) + '<div class="actions"><a class="button quiet" href="mailto:coledotdev.knoll210@slmail.me?subject=New%20project%20inquiry&amp;body=Hello%20cole.dev%2C%0A%0AI%20would%20like%20to%20discuss%20my%20software%20project.%20Please%20find%20my%20project%20brief%20attached.%0A%0AThank%20you">Email cole.dev ↗</a></div><p class="micro">Attach your downloaded project brief before sending. You can also email <a href="mailto:coledotdev.knoll210@slmail.me">coledotdev.knoll210@slmail.me</a> directly. Attachments are added manually in your email app.</p>' + '<p id="download-status" class="micro" role="status"></p></form>';
  }
  const form = body.querySelector("form");
  function readForm() {
    const data = new FormData(form);
    const fields = Object.fromEntries([...data].map(([k,v]) => [k,v.trim()]));
    if (step === 1) state.brief = {...fields, features:data.getAll("features")};
    if (step === 3) state.contact = fields;
    return fields;
  }
  if (form) {
    form.addEventListener("input", e => {
      if (e.target.required && ["name","problem"].includes(e.target.name)) {
        e.target.setCustomValidity(e.target.value && !e.target.value.trim() ? "Enter a response that contains more than spaces." : "");
      }
    });
    form.addEventListener("submit", e => {
      e.preventDefault();
      const fields = readForm();
      if (step === 0) {
        if (state.type !== fields.type) delete state.brief.features;
        state.type = fields.type;
      }
      if (step === 3) download();
      else render(step + 1);
    });
  }
  body.querySelector("[data-back]")?.addEventListener("click", () => {
    if (form) readForm();
    render(step - 1);
  });
  if (focus) panel.querySelector("h3").focus();
}
function section(title, content) {
  return '<div class="result"><h4>' + title + '</h4>' + content + '</div>';
}
function download() {
  const a = assess();
  const c = state.contact;
  const bullets = values => values.map(x => "• " + x).join("\n");
  const brief = ["cole.dev Project Estimator", "Preliminary assessment", a.summary, "Complexity: " + a.complexity,
    "Recommended features\n" + bullets(a.features), "Development phases\n" + bullets(a.phases),
    "Questions to clarify\n" + bullets(a.questions), "Contact\n" + [c.name,c.email,c.company,c.details].filter(Boolean).join("\n")].join("\n\n");
  const url = URL.createObjectURL(new Blob([brief], {type:"text/plain;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "cole-dev-project-brief.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("#download-status").textContent = "Your download has started. Next, select Email cole.dev and attach your project brief.";
}
render(0,false);
