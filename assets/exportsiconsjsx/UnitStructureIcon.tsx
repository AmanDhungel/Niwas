export const UnitStructureIcon = ({
  bgfill,
  imagefill,
}: {
  bgfill?: string;
  imagefill?: string;
}) => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill={bgfill}
    xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="25.5087"
      cy="25.5069"
      r="24.6743"
      transform="rotate(-90 25.5087 25.5069)"
      stroke={imagefill}
      strokeWidth="1.66718"
    />
    <mask
      id="mask0_340_26712"
      maskUnits="userSpaceOnUse"
      x="15"
      y="15"
      width="21"
      height="21">
      <rect x="15.2148" y="15.1094" width="20" height="20" fill="#D9D9D9" />
    </mask>
    <g mask="url(#mask0_340_26712)">
      <path
        d="M28.2148 32.1094V29.8594H24.4648V21.8594H22.2148V24.1094H17.2148V18.1094H22.2148V20.3594H28.2148V18.1094H33.2148V24.1094H28.2148V21.8594H25.9648V28.3594H28.2148V26.1094H33.2148V32.1094H28.2148ZM29.7148 22.6094H31.7148V19.6094H29.7148V22.6094ZM29.7148 30.6094H31.7148V27.6094H29.7148V30.6094ZM18.7148 22.6094H20.7148V19.6094H18.7148V22.6094Z"
        fill={imagefill}
      />
    </g>
  </svg>
);
