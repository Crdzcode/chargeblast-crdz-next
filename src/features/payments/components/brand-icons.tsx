import type { ReactNode } from 'react';

import type { CardBrand, PaymentMethod, WalletProvider } from '../model/transaction';

/**
 * 20×20 brand tiles matching the reference table (a wallet tile followed by
 * the card-network tile). Inline SVG keeps them crisp, themeable and free
 * of extra requests.
 */
function Tile({ fill, stroke, children }: { fill: string; stroke?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden focusable="false">
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="19"
        rx="3.5"
        fill={fill}
        stroke={stroke ?? fill}
        strokeWidth="1"
      />
      {children}
    </svg>
  );
}

const VISA_PATH =
  'M489.823 143.111C442.988 143.111 401.134 167.393 401.134 212.256C401.134 263.706 475.364 267.259 475.364 293.106C475.364 303.989 462.895 313.731 441.6 313.731C411.377 313.731 388.789 300.119 388.789 300.119L379.123 345.391C379.123 345.391 405.145 356.889 439.692 356.889C490.898 356.889 531.19 331.415 531.19 285.784C531.19 231.419 456.652 227.971 456.652 203.981C456.652 195.455 466.887 186.114 488.122 186.114C512.081 186.114 531.628 196.014 531.628 196.014L541.087 152.289C541.087 152.289 519.818 143.111 489.823 143.111ZM61.3294 146.411L60.1953 153.011C60.1953 153.011 79.8988 156.618 97.645 163.814C120.495 172.064 122.122 176.868 125.971 191.786L167.905 353.486H224.118L310.719 146.411H254.635L198.989 287.202L176.282 167.861C174.199 154.203 163.651 146.411 150.74 146.411H61.3294ZM333.271 146.411L289.275 353.486H342.756L386.598 146.411H333.271ZM631.554 146.411C618.658 146.411 611.825 153.318 606.811 165.386L528.458 353.486H584.542L595.393 322.136H663.72L670.318 353.486H719.805L676.633 146.411H631.554ZM638.848 202.356L655.473 280.061H610.935L638.848 202.356Z';

function CardBrandTile({ brand }: { brand: CardBrand }) {
  switch (brand) {
    case 'visa':
      return (
        <Tile fill="#23569a">
          <svg x="2.5" y="7" width="15" height="6" viewBox="55 138 670 224">
            <path d={VISA_PATH} fill="#ffffff" />
          </svg>
        </Tile>
      );
    case 'mastercard':
      return (
        <Tile fill="#000000">
          <svg x="3" y="5" width="14" height="10" viewBox="107 30 566 352">
            <path d="M465.738 69.1387H313.812V342.088H465.738V69.1387Z" fill="#FF5F00" />
            <path
              d="M323.926 205.613C323.926 150.158 349.996 100.94 390 69.1387C360.559 45.9902 323.42 32 282.91 32C186.945 32 109.297 109.648 109.297 205.613C109.297 301.578 186.945 379.227 282.91 379.227C323.42 379.227 360.559 365.237 390 342.088C349.94 310.737 323.926 261.069 323.926 205.613Z"
              fill="#EB001B"
            />
            <path
              d="M670.711 205.613C670.711 301.578 593.062 379.227 497.098 379.227C456.588 379.227 419.449 365.237 390.008 342.088C430.518 310.231 456.082 261.069 456.082 205.613C456.082 150.158 430.012 100.94 390.008 69.1387C419.393 45.9902 456.532 32 497.041 32C593.062 32 670.711 110.154 670.711 205.613Z"
              fill="#F79E1B"
            />
          </svg>
        </Tile>
      );
    case 'amex':
      return (
        <Tile fill="#2e77bc">
          <text
            x="10"
            y="12.2"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="5.6"
            fontWeight="700"
            fill="#ffffff"
          >
            AMEX
          </text>
        </Tile>
      );
    case 'discover':
      return (
        <Tile fill="#ffffff" stroke="#d8dee4">
          <text
            x="10"
            y="11.4"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="3.3"
            fontWeight="700"
            fill="#231f20"
          >
            DISC
            <tspan fill="#f47216">O</tspan>
            VER
          </text>
        </Tile>
      );
  }
}

function WalletTile({ wallet }: { wallet: WalletProvider }) {
  switch (wallet) {
    case 'link':
      return (
        <Tile fill="#00d66f">
          <path d="M7.6 5.2h2.7l4 4.8-4 4.8H7.6l4-4.8-4-4.8Z" fill="#011e0f" />
        </Tile>
      );
    case 'apple_pay':
      return (
        <Tile fill="#000000">
          <path
            d="M12.6 10.6c0-1.3 1.1-1.9 1.1-2-.6-.9-1.5-1-1.9-1-.8-.1-1.6.5-2 .5s-1-.5-1.7-.5c-.9 0-1.7.5-2.2 1.3-.9 1.6-.2 4 .7 5.3.4.6.9 1.3 1.6 1.3.6 0 .9-.4 1.6-.4s1 .4 1.6.4c.7 0 1.1-.6 1.6-1.3.5-.7.7-1.4.7-1.5 0 0-1.3-.5-1.3-2.1ZM11.4 6.3c.3-.4.6-1 .5-1.6-.5 0-1.1.3-1.5.7-.3.4-.6 1-.5 1.5.6.1 1.1-.2 1.5-.6Z"
            fill="#ffffff"
          />
        </Tile>
      );
    case 'google_pay':
      return (
        <Tile fill="#ffffff" stroke="#d8dee4">
          <text
            x="10"
            y="13.6"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="#4285f4"
          >
            G
          </text>
        </Tile>
      );
  }
}

function BankTile() {
  return (
    <Tile fill="#f5f6f8" stroke="#d8dee4">
      <g fill="#596171">
        <path d="M10 4.2 4.6 7.3v1.1h10.8V7.3L10 4.2Z" />
        <path d="M5.8 9.3h1.6v4H5.8v-4Zm3.4 0h1.6v4H9.2v-4Zm3.4 0h1.6v4h-1.6v-4Z" />
        <path d="M4.6 14.1h10.8v1.5H4.6v-1.5Z" />
      </g>
    </Tile>
  );
}

/** The tiles shown before the masked number, e.g. [Link][Visa] or [Bank]. */
export function PaymentMethodIcons({ method }: { method: PaymentMethod }) {
  if (method.type === 'ach') {
    return <BankTile />;
  }

  return (
    <>
      {method.type === 'wallet' ? <WalletTile wallet={method.wallet} /> : null}
      <CardBrandTile brand={method.brand} />
    </>
  );
}
