const QuoteTermsBlock = () => (
  <div className="mb-8 text-xs border border-brand-linen bg-brand-linen/30 rounded p-4 space-y-3">
    <p className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-brand-copper mb-2">
      Términos de venta / Terms of Sale
    </p>

    <div>
      <p className="font-semibold text-[10px] uppercase tracking-wider text-brand-charcoal mb-1">
        Términos de venta
      </p>
      <p className="text-dash-text-secondary leading-relaxed">
        Tiempo de entrega: de 4 a 6 semanas a partir de la fecha de pago.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        Aceptamos pagos en efectivo, depósito, cheque en pesos o dólares,
        transferencia y tarjeta de crédito. Se requiere un anticipo del 70% para
        tomar la orden. El tipo de cambio se determinará en función de la fecha
        en que se realice el depósito.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        La cotización es válida solo por 5 días. La realización de un depósito
        supone la aceptación de las condiciones anteriores.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        Tenga en cuenta que las devoluciones por motivos distintos a defectos de
        fabricación pueden estar sujetas a un cargo por restock de hasta el 30%.
        Artículos no retornables: Los acabados Living Finish y los pedidos
        personalizados no se pueden devolver ni cancelar. Los productos
        descontinuados no se pueden devolver. Los productos enviados hace más de
        8 meses no son elegibles para devolución. Créditos: Los créditos por
        productos devueltos se determinarán y aplicarán solo después de nuestra
        inspección de los artículos.
      </p>
    </div>

    <div>
      <p className="font-semibold text-[10px] uppercase tracking-wider text-brand-charcoal mb-1">
        Terms of Sale
      </p>
      <p className="text-dash-text-secondary leading-relaxed">
        Delivery: 4 to 6 weeks from the date of deposit.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        We accept payments in cash, wire transfer, US or MX checks, and credit
        cards. A 70% deposit is required to place the order. The balance is due
        when the order is ready for delivery. The exchange rate will be
        determined based on the date the deposit is made.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        The quote is valid for only 5 days. A deposit made indicates agreement
        to the terms indicated above.
      </p>
      <p className="text-dash-text-secondary leading-relaxed mt-1.5">
        Please note that returns for reasons other than manufacturing defects
        may be subject to a restocking fee of up to 30%. Non-Returnable Items:
        Living Finishes and custom orders cannot be returned or canceled.
        Discontinued products cannot be returned. Products shipped more than 8
        months ago are not eligible for return. Credits: Any credits for returned
        products will be determined and applied only after our inspection of the
        items.
      </p>
    </div>

    <div className="pt-3 border-t border-brand-linen">
      <p className="font-semibold text-[10px] uppercase tracking-wider text-brand-charcoal mb-1">
        Datos para depósito bancario / Bank Deposit Information
      </p>
      <p className="text-dash-text-secondary font-['JetBrains_Mono',monospace] leading-relaxed">
        ROGER FLOYD WILLIAMS
        <br />
        Santander
        <br />
        CUENTA: 60622782404
        <br />
        CLABE: 014240606227824044
      </p>
    </div>
  </div>
);

export { QuoteTermsBlock };
