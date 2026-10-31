import { Paise, SupportedCurrency, toPaise } from './types';

export class Money {
  private readonly _paise: Paise;

  private constructor(paise: Paise) {
    this._paise = paise;
  }

  public static fromPaise(paise: number): Money {
    return new Money(toPaise(Math.round(paise)));
  }

  public static fromRupees(rupees: number): Money {
    if (!Number.isFinite(rupees)) {
      throw new TypeError(`Rupees must be finite, received: ${rupees}`);
    }
    // Multiply by 100 with Math.round to avoid standard float drift (e.g. 19.99 * 100)
    return new Money(toPaise(Math.round(rupees * 100)));
  }

  public static zero(): Money {
    return new Money(toPaise(0));
  }

  public get paise(): Paise {
    return this._paise;
  }

  public get rupees(): number {
    return this._paise / 100;
  }

  public add(other: Money): Money {
    return new Money(toPaise(this._paise + other._paise));
  }

  public subtract(other: Money): Money {
    return new Money(toPaise(this._paise - other._paise));
  }

  public multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new TypeError(`Factor must be a non-negative finite number, received: ${factor}`);
    }
    return new Money(toPaise(Math.round(this._paise * factor)));
  }

  public divide(divisor: number): Money {
    if (!Number.isFinite(divisor) || divisor <= 0) {
      throw new TypeError(`Divisor must be a positive finite number, received: ${divisor}`);
    }
    return new Money(toPaise(Math.floor(this._paise / divisor)));
  }

  public isGreaterThan(other: Money): boolean {
    return this._paise > other._paise;
  }

  public isLessThan(other: Money): boolean {
    return this._paise < other._paise;
  }

  public equals(other: Money): boolean {
    return this._paise === other._paise;
  }

  /**
   * Format money into localized currency string.
   * e.g. for INR: ₹1,50,000
   */
  public format(currency: SupportedCurrency = 'INR'): string {
    const amountInMajor = this._paise / 100;
    const localeMap: Record<SupportedCurrency, { locale: string; currency: string }> = {
      INR: { locale: 'en-IN', currency: 'INR' },
      USD: { locale: 'en-US', currency: 'USD' },
      EUR: { locale: 'de-DE', currency: 'EUR' },
      GBP: { locale: 'en-GB', currency: 'GBP' },
    };

    const config = localeMap[currency] ?? localeMap.INR;

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: this._paise % 100 === 0 ? 0 : 2,
    }).format(amountInMajor);
  }
}
