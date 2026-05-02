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

  static money(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return value;
    }

    return numberValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  static dash(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return value;
  }
}

export default FormatHelper;