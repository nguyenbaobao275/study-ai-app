export function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu gửi lên không hợp lệ.",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
    }
    req[target] = result.data;
    next();
  };
}

