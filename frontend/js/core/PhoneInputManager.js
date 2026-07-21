(function () {
  const countries = [
    ["TR", "+90"], ["US/CA", "+1"], ["CN", "+86"], ["GB", "+44"], ["DE", "+49"],
    ["FR", "+33"], ["IT", "+39"], ["ES", "+34"], ["NL", "+31"], ["BE", "+32"],
    ["CH", "+41"], ["AT", "+43"], ["DK", "+45"], ["SE", "+46"], ["NO", "+47"],
    ["PL", "+48"], ["PT", "+351"], ["IE", "+353"], ["FI", "+358"], ["IS", "+354"],
    ["GR", "+30"], ["CZ", "+420"], ["SK", "+421"], ["HU", "+36"], ["RO", "+40"],
    ["BG", "+359"], ["HR", "+385"], ["RS", "+381"], ["SI", "+386"], ["UA", "+380"],
    ["RU/KZ", "+7"], ["GE", "+995"], ["AZ", "+994"], ["AE", "+971"], ["SA", "+966"],
    ["QA", "+974"], ["KW", "+965"], ["IL", "+972"], ["EG", "+20"], ["ZA", "+27"],
    ["MA", "+212"], ["TN", "+216"], ["DZ", "+213"], ["IN", "+91"], ["PK", "+92"],
    ["BD", "+880"], ["JP", "+81"], ["KR", "+82"], ["HK", "+852"], ["TW", "+886"],
    ["SG", "+65"], ["MY", "+60"], ["ID", "+62"], ["TH", "+66"], ["VN", "+84"],
    ["PH", "+63"], ["AU", "+61"], ["NZ", "+64"], ["MX", "+52"], ["BR", "+55"],
    ["AR", "+54"], ["CL", "+56"], ["CO", "+57"], ["PE", "+51"]
  ];
  const states = new WeakMap();
  const codes = [...new Set(countries.map(([, code]) => code))]
    .sort((left, right) => right.length - left.length);

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function enhance(input) {
    if (!input || states.has(input)) return input;
    const wrapper = document.createElement("div");
    wrapper.className = "international-phone-input";
    const select = document.createElement("select");
    select.className = "phone-country-code";
    select.setAttribute("aria-label", "Country calling code");
    countries.forEach(([country, code]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${country} ${code}`;
      option.selected = country === "TR";
      select.append(option);
    });
    input.type = "tel";
    input.inputMode = "tel";
    input.autocomplete = "tel-national";
    input.placeholder = input.placeholder || "Phone number";
    input.setAttribute("aria-label", input.getAttribute("aria-label") || "Phone number");
    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(select, input);
    states.set(input, { select });
    return input;
  }

  function setValue(inputOrId, value) {
    const input = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
    if (!input) return;
    enhance(input);
    const raw = String(value || "").trim();
    const compact = raw.replace(/[\s()-]/g, "");
    if (compact.startsWith("+")) {
      const code = codes.find((candidate) => compact.startsWith(candidate));
      if (code) {
        states.get(input).select.value = code;
        input.value = compact.slice(code.length);
        return;
      }
    }
    input.value = raw;
  }

  function getValue(inputOrId) {
    const input = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
    if (!input) return "";
    enhance(input);
    const local = digits(input.value).replace(/^0+/, "");
    return local ? `${states.get(input).select.value}${local}` : "";
  }

  function enhanceAll(root = document) {
    root.querySelectorAll?.('[data-international-phone="true"]').forEach(enhance);
  }

  window.PhoneInput = Object.freeze({ enhance, enhanceAll, getValue, setValue });
  document.addEventListener("DOMContentLoaded", () => enhanceAll());
})();
