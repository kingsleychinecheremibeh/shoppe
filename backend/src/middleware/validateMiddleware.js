export const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            return res.status(400).json({
                status: "fail",
                message: "Please check the highlighted fields and try again.",
                errors,
            });
        }

        req[target] = result.data; // Use the parsed and validated data
        next();
    }
}
