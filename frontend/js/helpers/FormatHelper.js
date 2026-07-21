class FormatHelper {
  static date(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString();
  }

  static number(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return value;
    }

    return numberValue.toLocaleString();
  }

  static money(value, currency = "USD") {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return value;
    }

    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency === "CNY" ? "CNY" : "USD"
    }).format(numberValue);
  }

  static dash(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return value;
  }
}

export default FormatHelper;
