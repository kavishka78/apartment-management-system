const ApartmentHubLogo = ({ className = "" }) => (
  <svg
    className={`apartmenthub-logo ${className}`.trim()}
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M24 5 8 15v26c0 1.1.9 2 2 2h28c1.1 0 2-.9 2-2V15L24 5Z"
    />
    <path fill="#f7f8f6" d="M15 20h6v7h-6zm12 0h6v7h-6zM15 32h6v7h-6zm12 0h6v7h-6z" />
    <path fill="#dce5da" d="M21 14h6v29h-6z" />
  </svg>
);

export default ApartmentHubLogo;
