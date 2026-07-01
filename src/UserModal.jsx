import { useState, useEffect } from "react";

const EMPTY_USER = { firstName: "", lastName: "", email: "", department: "" };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.department.trim()) {
    errors.department = "Department is required.";
  }

  return errors;
}

// this handles both the add/edit form and the delete confirmation popup,
// since they're both just a small box over a dark overlay
export default function UserModal(props) {
  if (props.mode === "delete") {
    return <DeleteConfirm user={props.user} onConfirm={props.onConfirm} onCancel={props.onCancel} busy={props.busy} />;
  }
  return <UserForm user={props.user} onSubmit={props.onSubmit} onCancel={props.onCancel} busy={props.busy} />;
}

function DeleteConfirm({ user, onConfirm, onCancel, busy }) {
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal modal-small" onMouseDown={(e) => e.stopPropagation()}>
        <p>Delete {user.firstName} {user.lastName}? This can't be undone.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-text" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserForm({ user, onSubmit, onCancel, busy }) {
  const isEdit = user ? true : false;
  const [values, setValues] = useState(user ? user : EMPTY_USER);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setValues(user ? user : EMPTY_USER);
    setErrors({});
    setTouched({});
  }, [user]);

  function handleChange(field, value) {
    const updated = { ...values };
    updated[field] = value;
    setValues(updated);
  }

  function handleBlur(field) {
    setTouched({ ...touched, [field]: true });
    setErrors(validate(values));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setTouched({ firstName: true, lastName: true, email: true, department: true });

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(values);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit User" : "Add User"}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              value={values.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={touched.firstName && errors.firstName ? "input-error" : ""}
            />
            {touched.firstName && errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              value={values.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={touched.lastName && errors.lastName ? "input-error" : ""}
            />
            {touched.lastName && errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={touched.email && errors.email ? "input-error" : ""}
            />
            {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              value={values.department}
              onChange={(e) => handleChange("department", e.target.value)}
              onBlur={() => handleBlur("department")}
              className={touched.department && errors.department ? "input-error" : ""}
            />
            {touched.department && errors.department && <span className="field-error">{errors.department}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-text" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
