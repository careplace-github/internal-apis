/**
 * Class that contains schema methods for every model 
 */



/**
 * Method that before creating the document it will order the fields in the document alphabetically. 
 * In exception of the _id field.
 */
this.schema.pre('save', function (next) {
    const doc = this;
    const ordered = {};
    Object.keys(doc.toObject()).sort().forEach(function (key) {
        ordered[key] = doc[key];
    });
    doc.set(ordered);
    next();
});