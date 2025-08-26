<<<<<<< HEAD
export const catchAsyncErrors = (theFunction) => {
    return (req, res, next) => {
        Promise.resolve(theFunction(req, res, next)).catch(next);
    };
=======
export const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
>>>>>>> 1730d72 (final commit)
};
