/* =========================================================
   BillSplit
   Vanilla JavaScript
   Platform Fee = 2%
========================================================= */


/* =========================
   STORAGE HELPERS
========================= */

function readStorageArray(key) {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(key) || "[]"
            );

        return Array.isArray(data) ? data : [];

    } catch (error) {

        return [];

    }

}


function readStorageObject(key, fallback) {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(key) || "null"
            );

        if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data)
        ) {

            return {
                ...fallback,
                ...data
            };

        }

    } catch (error) {}

    return {
        ...fallback
    };

}


/* =========================
   GLOBAL DATA
========================= */

const PLATFORM_FEE_RATE = 2;


const currencies = {

    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    CAD: "$",
    AUD: "$",
    SGD: "$"

};


let bills =
    readStorageArray(
        "billsplit_bills"
    );


let settings =
    readStorageObject(
        "billsplit_settings",
        {
            currency: "INR",
            darkMode: false,
            birthday: ""
        }
    );


let couponHistory =
    readStorageArray(
        "billsplit_coupon_history"
    );


let people = [];


let splitMode = "equal";


let selectedTip = 0;


let customTipValue = null;


let appliedCoupon = null;


let billPhotoData = null;


/* =========================
   COUPONS
========================= */

const coupons = [

    {
        id: 1,
        code: "WELCOME50",
        title: "₹50 OFF",
        description: "Get ₹50 off on your bill.",
        type: "fixed",
        value: 50,
        minBill: 300,
        maxDiscount: 50,
        expiry: "2027-12-31",
        featured: true,
        limitedTime: false,
        firstBillOnly: false,
        birthdayOnly: false
    },

    {
        id: 2,
        code: "SAVE20",
        title: "20% OFF",
        description: "Save 20% on your bill.",
        type: "percentage",
        value: 20,
        minBill: 500,
        maxDiscount: 200,
        expiry: "2027-12-31",
        featured: true,
        limitedTime: false,
        firstBillOnly: false,
        birthdayOnly: false
    },

    {
        id: 3,
        code: "FIRSTBILL25",
        title: "25% OFF",
        description: "Special discount on your first saved bill.",
        type: "percentage",
        value: 25,
        minBill: 400,
        maxDiscount: 300,
        expiry: "2027-12-31",
        featured: false,
        limitedTime: false,
        firstBillOnly: true,
        birthdayOnly: false
    },

    {
        id: 4,
        code: "BIRTHDAY30",
        title: "30% OFF",
        description: "Special birthday discount.",
        type: "percentage",
        value: 30,
        minBill: 500,
        maxDiscount: 500,
        expiry: "2027-12-31",
        featured: true,
        limitedTime: false,
        firstBillOnly: false,
        birthdayOnly: true
    },

    {
        id: 5,
        code: "FLASH100",
        title: "₹100 OFF",
        description: "Limited time ₹100 discount.",
        type: "fixed",
        value: 100,
        minBill: 1000,
        maxDiscount: 100,
        expiry: "2027-12-31",
        featured: false,
        limitedTime: true,
        firstBillOnly: false,
        birthdayOnly: false
    }

];


/* =========================
   INITIALIZATION
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

        updateCurrencyUI();

        renderCoupons();

        renderHistory();

        updateDashboard();

        resetPeople();

        setupPhotoInput();

        calculateBill();

    }
);


/* =========================
   STORAGE
========================= */

function saveBills() {

    try {

        localStorage.setItem(
            "billsplit_bills",
            JSON.stringify(bills)
        );

    } catch (error) {

        showToast(
            "Unable to save bills. Storage may be full."
        );

    }

}


function saveSettings() {

    localStorage.setItem(
        "billsplit_settings",
        JSON.stringify(settings)
    );

}


function saveCouponHistory() {

    localStorage.setItem(
        "billsplit_coupon_history",
        JSON.stringify(couponHistory)
    );

}


/* =========================
   SETTINGS
========================= */

function loadSettings() {

    const currencySelect =
        document.getElementById(
            "currencySelect"
        );

    const birthdayInput =
        document.getElementById(
            "birthdayInput"
        );

    const darkModeToggle =
        document.getElementById(
            "darkModeToggle"
        );


    if (currencySelect) {

        currencySelect.value =
            currencies[settings.currency]
                ? settings.currency
                : "INR";

    }


    if (birthdayInput) {

        birthdayInput.value =
            settings.birthday || "";

    }


    if (darkModeToggle) {

        darkModeToggle.checked =
            Boolean(settings.darkMode);

    }


    document.body.classList.toggle(
        "dark",
        Boolean(settings.darkMode)
    );

}


function changeCurrency() {

    const select =
        document.getElementById(
            "currencySelect"
        );


    if (!select) return;


    settings.currency =
        select.value;


    saveSettings();

    updateCurrencyUI();

    calculateBill();

    renderCoupons();

    renderHistory();

    updateDashboard();

    showToast(
        "Currency updated"
    );

}


function updateCurrencyUI() {

    const symbol =
        currencies[settings.currency] ||
        "₹";


    const element =
        document.getElementById(
            "currencySymbol"
        );


    if (element) {

        element.textContent =
            symbol;

    }

}


function toggleDarkMode() {

    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    settings.darkMode =
        Boolean(toggle && toggle.checked);


    document.body.classList.toggle(
        "dark",
        settings.darkMode
    );


    saveSettings();

}


function saveBirthday() {

    const input =
        document.getElementById(
            "birthdayInput"
        );


    settings.birthday =
        input
            ? input.value
            : "";


    saveSettings();

    showToast(
        "Birthday saved"
    );

}


/* =========================
   NAVIGATION
========================= */

function setActiveNav(button) {

    document
        .querySelectorAll(".nav-item")
        .forEach(
            item =>
                item.classList.remove("active")
        );


    if (button) {

        button.classList.add("active");

    }

}


function showPage(
    pageId,
    navButton = null
) {

    document
        .querySelectorAll(".page")
        .forEach(
            page =>
                page.classList.remove("active")
        );


    const page =
        document.getElementById(
            pageId
        );


    if (!page) return;


    page.classList.add("active");


    if (navButton) {

        setActiveNav(navButton);

    } else {

        const buttons =
            document.querySelectorAll(
                ".nav-item"
            );


        buttons.forEach(button => {

            button.classList.remove(
                "active"
            );

        });


        const matchingButton =
            Array.from(buttons)
                .find(
                    button =>
                        button.getAttribute(
                            "onclick"
                        ) &&
                        button.getAttribute(
                            "onclick"
                        ).includes(
                            pageId
                        )
                );


        if (matchingButton) {

            matchingButton.classList.add(
                "active"
            );

        }

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================
   CALCULATOR
========================= */

function openCalculator() {

    resetCalculator();

    showPage(
        "calculatorPage"
    );


    const buttons =
        document.querySelectorAll(
            ".nav-item"
        );


    buttons.forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );


    if (buttons[1]) {

        buttons[1].classList.add(
            "active"
        );

    }

}


function resetCalculator() {

    const billName =
        document.getElementById(
            "billName"
        );


    const billAmount =
        document.getElementById(
            "billAmount"
        );


    if (billName) {

        billName.value = "";

    }


    if (billAmount) {

        billAmount.value = "";

    }


    selectedTip = 0;

    customTipValue = null;

    appliedCoupon = null;

    billPhotoData = null;

    const preview =
        document.getElementById(
            "billPreview"
        );


    const removeButton =
        document.getElementById(
            "removePhotoBtn"
        );


    if (preview) {

        preview.removeAttribute(
            "src"
        );

        preview.style.display =
            "none";

    }


    if (removeButton) {

        removeButton.style.display =
            "none";

    }


    document
        .querySelectorAll(
            ".tip-btn"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );


    const firstTip =
        document.querySelector(
            ".tip-btn"
        );


    if (firstTip) {

        firstTip.classList.add(
            "active"
        );

    }


    splitMode = "equal";

    resetPeople();

    updateAppliedCouponUI();

    calculateBill();

}


/* =========================
   MAIN CALCULATION
========================= */

function calculateBill() {

    const amount =
        getBillAmount();


    /* 2% PLATFORM FEE */

    const platformFee =
        calculatePlatformFee(
            amount
        );


    /* TIP */

    const tipPercent =
        customTipValue !== null
            ? customTipValue
            : selectedTip;


    const tipAmount =
        amount *
        tipPercent /
        100;


    /* AUTOMATIC DISCOUNT */

    const discountPercent =
        getDiscountPercent(
            amount
        );


    const discountAmount =
        amount *
        discountPercent /
        100;


    /* COUPON */

    let couponDiscount = 0;


    if (appliedCoupon) {

        couponDiscount =
            calculateCouponDiscount(
                appliedCoupon,
                amount
            );

    }


    /* FINAL TOTAL */

    const finalTotal =
        Math.max(
            0,

            amount +
            platformFee +
            tipAmount -
            discountAmount -
            couponDiscount
        );


    /* UPDATE UI */

    setText(
        "platformFeeAmount",
        formatMoney(platformFee)
    );


    setText(
        "tipAmount",
        formatMoney(tipAmount)
    );


    setText(
        "discountPercent",
        discountPercent + "%"
    );


    setText(
        "discountAmount",
        formatMoney(discountAmount)
    );


    setText(
        "discountMessage",
        getDiscountMessage(
            amount
        )
    );


    setText(
        "summarySubtotal",
        formatMoney(amount)
    );


    setText(
        "summaryPlatformFee",
        formatMoney(platformFee)
    );


    setText(
        "summaryTip",
        formatMoney(tipAmount)
    );


    setText(
        "summaryDiscount",
        "-" + formatMoney(discountAmount)
    );


    setText(
        "summaryCoupon",
        "-" + formatMoney(couponDiscount)
    );


    setText(
        "finalTotal",
        formatMoney(finalTotal)
    );


    updatePeopleAmounts(
        finalTotal
    );


    updatePaymentSummary(
        finalTotal
    );

}


/* =========================
   PLATFORM FEE
========================= */

function calculatePlatformFee(amount) {

    return (
        Number(amount || 0) *
        PLATFORM_FEE_RATE /
        100
    );

}


/* =========================
   TIP
========================= */

function selectTip(
    percent,
    button
) {

    selectedTip =
        Number(percent) || 0;


    customTipValue = null;


    document
        .querySelectorAll(
            ".tip-btn"
        )
        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    calculateBill();

}


function customTip() {

    const value =
        prompt(
            "Enter custom tip percentage:",
            "10"
        );


    if (value === null) return;


    const percent =
        parseFloat(value);


    if (
        !Number.isFinite(percent) ||
        percent < 0
    ) {

        showToast(
            "Enter a valid tip percentage."
        );

        return;

    }


    selectedTip = 0;

    customTipValue =
        percent;


    document
        .querySelectorAll(
            ".tip-btn"
        )
        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );


    calculateBill();


    showToast(
        `Custom tip ${percent}% applied`
    );

}


/* =========================
   DISCOUNT
========================= */

function getDiscountPercent(
    amount
) {

    if (amount >= 5000) {

        return 25;

    }


    if (amount >= 3500) {

        return 20;

    }


    if (amount >= 2500) {

        return 15;

    }


    if (amount >= 1000) {

        return 5;

    }


    return 0;

}


function getDiscountMessage(
    amount
) {

    if (amount <= 0) {

        return "Add bill amount to calculate discount.";

    }


    if (amount < 1000) {

        return `Spend ${formatMoney(1000)} or more to get 5% discount.`;

    }


    if (amount < 2500) {

        return "You received 5% automatic discount.";

    }


    if (amount < 3500) {

        return "You received 15% automatic discount.";

    }


    if (amount < 5000) {

        return "You received 20% automatic discount.";

    }


    return "You received the maximum 25% automatic discount.";

}


/* =========================
   COUPONS
========================= */

function isCouponExpired(
    coupon
) {

    const today =
        new Date();


    const expiry =
        new Date(
            coupon.expiry +
            "T23:59:59"
        );


    return today > expiry;

}


function isFirstBill() {

    return bills.length === 0;

}


function isBirthdayEligible() {

    if (!settings.birthday) {

        return false;

    }


    const birthday =
        new Date(
            settings.birthday +
            "T00:00:00"
        );


    const today =
        new Date();


    return (
        today.getMonth() ===
            birthday.getMonth() &&

        today.getDate() ===
            birthday.getDate()
    );

}


function validateCoupon(
    coupon
) {

    const amount =
        getBillAmount();


    if (
        isCouponExpired(
            coupon
        )
    ) {

        return "This coupon has expired.";

    }


    if (
        amount <
        coupon.minBill
    ) {

        return (
            `Minimum bill amount is ` +
            `${formatMoney(coupon.minBill)}.`
        );

    }


    if (
        coupon.firstBillOnly &&
        !isFirstBill()
    ) {

        return (
            "This coupon is only available " +
            "for your first bill."
        );

    }


    if (
        coupon.birthdayOnly &&
        !isBirthdayEligible()
    ) {

        return (
            "This coupon is only available " +
            "on your birthday."
        );

    }


    return null;

}


function calculateCouponDiscount(
    coupon,
    amount
) {

    let discount = 0;


    if (
        coupon.type ===
        "percentage"
    ) {

        discount =
            amount *
            coupon.value /
            100;

    } else {

        discount =
            coupon.value;

    }


    if (
        coupon.maxDiscount &&
        discount >
            coupon.maxDiscount
    ) {

        discount =
            coupon.maxDiscount;

    }


    return Math.min(
        discount,
        amount
    );

}


function openCouponModal() {

    renderModalCoupons();


    document
        .getElementById(
            "couponModal"
        )
        .classList.add(
            "active"
        );

}


function closeCouponModal() {

    document
        .getElementById(
            "couponModal"
        )
        .classList.remove(
            "active"
        );

}


function renderCoupons() {

    const container =
        document.getElementById(
            "couponList"
        );


    if (!container) return;


    const activeCoupons =
        coupons.filter(
            coupon =>
                !isCouponExpired(
                    coupon
                )
        );


    if (!activeCoupons.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🎟️</div>
                <h3>No active coupons</h3>
                <p>Check again later.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        activeCoupons
            .map(
                coupon =>
                    createCouponHTML(
                        coupon
                    )
            )
            .join("");

}


function renderModalCoupons() {

    const container =
        document.getElementById(
            "modalCouponList"
        );


    if (!container) return;


    container.innerHTML =
        coupons
            .filter(
                coupon =>
                    !isCouponExpired(
                        coupon
                    )
            )
            .map(
                coupon =>
                    createCouponHTML(
                        coupon
                    )
            )
            .join("");

}


function createCouponHTML(
    coupon
) {

    let badges = "";


    if (coupon.featured) {

        badges +=
            `<span>FEATURED</span>`;

    }


    if (coupon.limitedTime) {

        badges +=
            `<span>LIMITED TIME</span>`;

    }


    if (coupon.firstBillOnly) {

        badges +=
            `<span>FIRST BILL</span>`;

    }


    if (coupon.birthdayOnly) {

        badges +=
            `<span>BIRTHDAY</span>`;

    }


    const discountText =
        coupon.type ===
            "percentage"

            ? `${coupon.value}% OFF`

            : `${formatMoney(coupon.value)} OFF`;


    return `

        <div class="coupon-card">

            <div class="coupon-top">

                <div>

                    <div class="coupon-code">
                        ${escapeHTML(coupon.code)}
                    </div>

                    <p>
                        ${escapeHTML(
                            coupon.description
                        )}
                    </p>

                </div>

                <div class="coupon-discount">
                    ${discountText}
                </div>

            </div>


            <div class="coupon-meta">

                ${badges}

                <span>
                    Min ${formatMoney(
                        coupon.minBill
                    )}
                </span>

                <span>
                    Expires ${formatDate(
                        coupon.expiry
                    )}
                </span>

            </div>


            <button
                class="coupon-apply"
                onclick="applyCoupon('${escapeHTML(
                    coupon.code
                )}')"
            >
                Apply Coupon
            </button>

        </div>

    `;

}


function applyCoupon(code) {

    const coupon =
        coupons.find(
            item =>
                item.code === code
        );


    if (!coupon) {

        showToast(
            "Coupon not found."
        );

        return;

    }


    const error =
        validateCoupon(
            coupon
        );


    if (error) {

        showToast(error);

        return;

    }


    appliedCoupon =
        coupon;


    updateAppliedCouponUI();

    calculateBill();

    closeCouponModal();


    showToast(
        `${coupon.code} applied successfully`
    );

}


function removeCoupon() {

    appliedCoupon = null;

    updateAppliedCouponUI();

    calculateBill();

    showToast(
        "Coupon removed"
    );

}


function updateAppliedCouponUI() {

    const container =
        document.getElementById(
            "appliedCoupon"
        );


    if (!container) return;


    if (!appliedCoupon) {

        container.classList.add(
            "hidden"
        );

        container.innerHTML = "";

        return;

    }


    const amount =
        getBillAmount();


    const discount =
        calculateCouponDiscount(
            appliedCoupon,
            amount
        );


    container.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <strong>
            🎟️ ${escapeHTML(
                appliedCoupon.code
            )}
        </strong>

        <span>
            Saving ${formatMoney(
                discount
            )}
        </span>

        <button
            onclick="removeCoupon()"
            style="
                float:right;
                border:none;
                background:none;
                color:#ef4444;
                font-weight:700;
            "
        >
            Remove
        </button>

    `;

}


/* =========================
   PEOPLE
========================= */

function resetPeople() {

    people = [

        {
            id:
                Date.now() +
                Math.random(),

            name:
                "Person 1",

            amount:
                0,

            paid:
                false

        }

    ];


    renderPeople();

}


function addPerson() {

    people.push({

        id:
            Date.now() +
            Math.random(),

        name:
            `Person ${people.length + 1}`,

        amount:
            0,

        paid:
            false

    });


    renderPeople();

    calculateBill();

}


function removePerson(id) {

    if (
        people.length <= 1
    ) {

        showToast(
            "At least one person is required."
        );

        return;

    }


    people =
        people.filter(
            person =>
                String(person.id) !==
                String(id)
        );


    renderPeople();

    calculateBill();

}


function setSplitMode(mode) {

    splitMode =
        mode === "custom"
            ? "custom"
            : "equal";


    const equalButton =
        document.getElementById(
            "equalSplitBtn"
        );


    const customButton =
        document.getElementById(
            "customSplitBtn"
        );


    if (equalButton) {

        equalButton.classList.toggle(
            "active",
            splitMode === "equal"
        );

    }


    if (customButton) {

        customButton.classList.toggle(
            "active",
            splitMode === "custom"
        );

    }


    calculateBill();

}


function distributeEqual(
    total
) {

    if (!people.length) return;


    const roundedTotal =
        Number(
            total.toFixed(2)
        );


    const base =
        Math.floor(
            (
                roundedTotal /
                people.length
            ) * 100
        ) / 100;


    let remaining =
        roundedTotal;


    people.forEach(
        (person, index) => {

            if (
                index ===
                people.length - 1
            ) {

                person.amount =
                    Number(
                        remaining.toFixed(2)
                    );

            } else {

                person.amount =
                    base;

                remaining -= base;

            }

        }
    );

}


function updatePeopleAmounts(
    total
) {

    if (!people.length) return;


    if (
        splitMode === "equal"
    ) {

        distributeEqual(
            total
        );

    }


    renderPeople();

}


function updatePersonName(
    id,
    value
) {

    const person =
        people.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!person) return;


    person.name =
        value.trim() ||
        "Unnamed";


    renderPeople();

}


function updatePersonAmount(
    id,
    value
) {

    if (
        splitMode === "equal"
    ) {

        return;

    }


    const person =
        people.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!person) return;


    const amount =
        parseFloat(value);


    person.amount =
        Number.isFinite(amount) &&
        amount >= 0
            ? Number(
                amount.toFixed(2)
            )
            : 0;


    renderPeople();

    updatePaymentSummary(
        getFinalTotal()
    );

}


function togglePaid(id) {

    const person =
        people.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!person) return;


    person.paid =
        !person.paid;


    renderPeople();

    updatePaymentSummary(
        getFinalTotal()
    );

}


function renderPeople() {

    const container =
        document.getElementById(
            "peopleList"
        );


    if (!container) return;


    container.innerHTML = "";


    people.forEach(
        person => {

            container.innerHTML += `

                <div class="person-row">

                    <input
                        type="text"
                        value="${escapeHTML(
                            person.name
                        )}"
                        placeholder="Person name"
                        onchange="updatePersonName(
                            '${person.id}',
                            this.value
                        )"
                    >

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value="${Number(
                            person.amount || 0
                        ).toFixed(2)}"
                        ${
                            splitMode === "equal"
                                ? "disabled"
                                : ""
                        }
                        onchange="updatePersonAmount(
                            '${person.id}',
                            this.value
                        )"
                    >

                    <button
                        class="person-remove"
                        onclick="removePerson(
                            '${person.id}'
                        )"
                    >
                        ×
                    </button>

                </div>

                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        margin-top:-4px;
                        margin-bottom:8px;
                    "
                >

                    <button
                        onclick="togglePaid(
                            '${person.id}'
                        )"
                        style="
                            border:none;
                            background:none;
                            color:${
                                person.paid
                                    ? "#16a34a"
                                    : "#6b7280"
                            };
                            font-size:11px;
                            font-weight:700;
                        "
                    >
                        ${
                            person.paid
                                ? "✓ Paid"
                                : "○ Mark as Paid"
                        }
                    </button>

                </div>

            `;

        }
    );

}


/* =========================
   PAYMENT SUMMARY
========================= */

function getFinalTotal() {

    const amount =
        getBillAmount();


    const platformFee =
        calculatePlatformFee(
            amount
        );


    const tipPercent =
        customTipValue !== null
            ? customTipValue
            : selectedTip;


    const tip =
        amount *
        tipPercent /
        100;


    const discountPercent =
        getDiscountPercent(
            amount
        );


    const discount =
        amount *
        discountPercent /
        100;


    const couponDiscount =
        appliedCoupon
            ? calculateCouponDiscount(
                appliedCoupon,
                amount
            )
            : 0;


    return Math.max(
        0,

        amount +
        platformFee +
        tip -
        discount -
        couponDiscount
    );

}


function updatePaymentSummary(
    total
) {

    const paid =
        people.reduce(
            (
                sum,
                person
            ) =>
                person.paid
                    ? sum +
                        Number(
                            person.amount || 0
                        )
                    : sum,

            0
        );


    const remaining =
        Math.max(
            0,
            total -
            paid
        );


    setText(
        "paidAmount",
        formatMoney(paid)
    );


    setText(
        "remainingAmount",
        formatMoney(remaining)
    );

}


/* =========================
   BILL PHOTO
========================= */

function setupPhotoInput() {

    const input =
        document.getElementById(
            "billPhoto"
        );


    if (!input) return;


    input.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files &&
                event.target.files[0];


            if (!file) return;


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showToast(
                    "Please select an image."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    billPhotoData =
                        e.target.result;


                    const preview =
                        document.getElementById(
                            "billPreview"
                        );


                    const removeButton =
                        document.getElementById(
                            "removePhotoBtn"
                        );


                    preview.src =
                        billPhotoData;


                    preview.style.display =
                        "block";


                    removeButton.style.display =
                        "block";


                    showToast(
                        "Bill photo added"
                    );

                };


            reader.onerror =
                function () {

                    showToast(
                        "Unable to read image."
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


function openCamera() {

    const input =
        document.getElementById(
            "billPhoto"
        );


    if (input) {

        input.click();

    }

}


function removeBillPhoto() {

    billPhotoData = null;


    const input =
        document.getElementById(
            "billPhoto"
        );


    const preview =
        document.getElementById(
            "billPreview"
        );


    const removeButton =
        document.getElementById(
            "removePhotoBtn"
        );


    if (input) {

        input.value = "";

    }


    if (preview) {

        preview.removeAttribute(
            "src"
        );

        preview.style.display =
            "none";

    }


    if (removeButton) {

        removeButton.style.display =
            "none";

    }

}


/* =========================
   SAVE BILL
========================= */

function saveBill() {

    const name =
        (
            document.getElementById(
                "billName"
            )?.value || ""
        ).trim();


    const amount =
        getBillAmount();


    if (!name) {

        showToast(
            "Please enter a bill name."
        );

        return;

    }


    if (
        amount <= 0
    ) {

        showToast(
            "Please enter a valid bill amount."
        );

        return;

    }


    if (!people.length) {

        showToast(
            "Add at least one person."
        );

        return;

    }


    const platformFee =
        calculatePlatformFee(
            amount
        );


    const tipPercent =
        customTipValue !== null
            ? customTipValue
            : selectedTip;


    const tip =
        amount *
        tipPercent /
        100;


    const discountPercent =
        getDiscountPercent(
            amount
        );


    const discount =
        amount *
        discountPercent /
        100;


    const couponDiscount =
        appliedCoupon
            ? calculateCouponDiscount(
                appliedCoupon,
                amount
            )
            : 0;


    const total =
        Math.max(
            0,

            amount +
            platformFee +
            tip -
            discount -
            couponDiscount
        );


    /* SPLIT */

    if (
        splitMode === "equal"
    ) {

        distributeEqual(
            total
        );

    } else {

        const peopleTotal =
            people.reduce(
                (
                    sum,
                    person
                ) =>
                    sum +
                    Number(
                        person.amount || 0
                    ),

                0
            );


        if (
            Math.abs(
                peopleTotal -
                total
            ) > 0.01
        ) {

            showToast(
                `People amounts must equal ${formatMoney(total)}`
            );

            return;

        }

    }


    const bill = {

        id:
            Date.now().toString(),

        name:
            name,

        date:
            new Date().toISOString(),

        subtotal:
            Number(
                amount.toFixed(2)
            ),

        platformFeeRate:
            PLATFORM_FEE_RATE,

        platformFee:
            Number(
                platformFee.toFixed(2)
            ),

        tip:
            Number(
                tip.toFixed(2)
            ),

        tipPercent:
            Number(
                tipPercent.toFixed(2)
            ),

        discountPercent:
            discountPercent,

        discount:
            Number(
                discount.toFixed(2)
            ),

        coupon:
            appliedCoupon
                ? appliedCoupon.code
                : null,

        couponDiscount:
            Number(
                couponDiscount.toFixed(2)
            ),

        total:
            Number(
                total.toFixed(2)
            ),

        currency:
            settings.currency,

        people:
            JSON.parse(
                JSON.stringify(
                    people
                )
            ),

        photo:
            billPhotoData

    };


    bills.unshift(
        bill
    );


    saveBills();


    if (appliedCoupon) {

        couponHistory.unshift({

            id:
                Date.now(),

            code:
                appliedCoupon.code,

            billId:
                bill.id,

            discount:
                couponDiscount,

            date:
                bill.date

        });


        saveCouponHistory();

    }


    showToast(
        "Bill saved successfully!"
    );


    updateDashboard();

    renderHistory();


    setTimeout(
        function () {

            showPage(
                "homePage"
            );

        },
        700
    );

}


/* =========================
   HISTORY
========================= */

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (!container) return;


    if (!bills.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div>🧾</div>

                <h3>No bills yet</h3>

                <p>
                    Your saved bills will appear here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        bills
            .map(
                bill =>
                    createBillCard(
                        bill
                    )
            )
            .join("");

}


function renderRecentBills() {

    const container =
        document.getElementById(
            "recentBills"
        );


    if (!container) return;


    const recent =
        bills.slice(
            0,
            3
        );


    if (!recent.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div>🧾</div>

                <h3>No bills yet</h3>

                <p>
                    Create your first bill to see it here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        recent
            .map(
                bill =>
                    createBillCard(
                        bill
                    )
            )
            .join("");

}


function createBillCard(
    bill
) {

    const symbol =
        currencies[
            bill.currency
        ] ||
        "₹";


    const peopleCount =
        Array.isArray(
            bill.people
        )
            ? bill.people.length
            : 0;


    return `

        <div
            class="bill-card"
            onclick="openBillDetails(
                '${escapeHTML(bill.id)}'
            )"
        >

            <div class="bill-card-top">

                <div>

                    <h3>
                        ${escapeHTML(
                            bill.name
                        )}
                    </h3>

                    <div class="date">
                        ${formatDateTime(
                            bill.date
                        )}
                    </div>

                </div>

                <div class="bill-total">
                    ${symbol}${Number(
                        bill.total || 0
                    ).toFixed(2)}
                </div>

            </div>


            <div class="bill-card-bottom">

                <span>
                    👥 ${peopleCount} people
                </span>

                <span>
                    ${
                        bill.coupon
                            ? "🎟️ " +
                                escapeHTML(
                                    bill.coupon
                                )
                            : "No coupon"
                    }
                </span>

            </div>

        </div>

    `;

}


/* =========================
   BILL DETAILS
========================= */

function openBillDetails(
    id
) {

    const bill =
        bills.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!bill) return;


    const symbol =
        currencies[
            bill.currency
        ] ||
        "₹";


    const platformFee =
        Number(
            bill.platformFee ??
            bill.gst ??
            0
        );


    const platformFeeRate =
        Number(
            bill.platformFeeRate ??
            bill.gstRate ??
            PLATFORM_FEE_RATE
        );


    const billPeople =
        Array.isArray(
            bill.people
        )
            ? bill.people
            : [];


    const peopleHTML =
        billPeople
            .map(
                person => `

                    <div class="detail-row">

                        <span>
                            ${escapeHTML(
                                person.name
                            )}
                        </span>

                        <strong>
                            ${symbol}${Number(
                                person.amount || 0
                            ).toFixed(2)}

                            ${
                                person.paid
                                    ? " ✓"
                                    : ""
                            }

                        </strong>

                    </div>

                `
            )
            .join("");


    const details =
        document.getElementById(
            "billDetails"
        );


    details.innerHTML = `

        <div class="detail-section">

            <h3>
                ${escapeHTML(
                    bill.name
                )}
            </h3>

            <p class="muted">
                ${formatDateTime(
                    bill.date
                )}
            </p>

        </div>


        <div class="detail-section">

            <div class="detail-row">

                <span>
                    Bill Amount
                </span>

                <strong>
                    ${symbol}${Number(
                        bill.subtotal || 0
                    ).toFixed(2)}
                </strong>

            </div>


            <div class="detail-row">

                <span>
                    Platform Fee (${platformFeeRate}%)
                </span>

                <strong>
                    ${symbol}${platformFee.toFixed(2)}
                </strong>

            </div>


            <div class="detail-row">

                <span>
                    Tip
                </span>

                <strong>
                    ${symbol}${Number(
                        bill.tip || 0
                    ).toFixed(2)}
                </strong>

            </div>


            <div class="detail-row">

                <span>
                    Discount (${Number(
                        bill.discountPercent || 0
                    )}%)
                </span>

                <strong>
                    -${symbol}${Number(
                        bill.discount || 0
                    ).toFixed(2)}
                </strong>

            </div>


            <div class="detail-row">

                <span>
                    Coupon
                </span>

                <strong>
                    -${symbol}${Number(
                        bill.couponDiscount || 0
                    ).toFixed(2)}
                </strong>

            </div>


            <div class="detail-row detail-total">

                <span>
                    Total
                </span>

                <strong>
                    ${symbol}${Number(
                        bill.total || 0
                    ).toFixed(2)}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h3>People</h3>

            ${peopleHTML}

        </div>


        <button
            class="primary-btn big-btn"
            onclick="shareBill(
                '${escapeHTML(bill.id)}'
            )"
        >
            📤 Share Bill
        </button>


        <button
            class="primary-btn big-btn"
            style="
                margin-top:8px;
                background:#25D366;
            "
            onclick="shareWhatsApp(
                '${escapeHTML(bill.id)}'
            )"
        >
            🟢 Share on WhatsApp
        </button>


        <button
            class="small-btn danger"
            style="
                width:100%;
                margin-top:8px;
            "
            onclick="deleteBill(
                '${escapeHTML(bill.id)}'
            )"
        >
            🗑️ Delete Bill
        </button>

    `;


    document
        .getElementById(
            "billDetailsModal"
        )
        .classList.add(
            "active"
        );

}


function closeBillDetails() {

    document
        .getElementById(
            "billDetailsModal"
        )
        .classList.remove(
            "active"
        );

}


function deleteBill(id) {

    if (
        !confirm(
            "Delete this bill? This cannot be undone."
        )
    ) {

        return;

    }


    bills =
        bills.filter(
            bill =>
                String(bill.id) !==
                String(id)
        );


    saveBills();

    closeBillDetails();

    renderHistory();

    updateDashboard();

    showToast(
        "Bill deleted"
    );

}


/* =========================
   CLEAR DATA
========================= */

function clearHistory() {

    if (!bills.length) {

        showToast(
            "No bills to clear"
        );

        return;

    }


    if (
        !confirm(
            "Delete all bill history?"
        )
    ) {

        return;

    }


    bills = [];


    saveBills();

    renderHistory();

    updateDashboard();

    showToast(
        "Bill history cleared"
    );

}


function clearAllData() {

    if (
        !confirm(
            "Clear ALL BillSplit data?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        "billsplit_bills"
    );

    localStorage.removeItem(
        "billsplit_settings"
    );

    localStorage.removeItem(
        "billsplit_coupon_history"
    );


    bills = [];

    couponHistory = [];


    settings = {

        currency: "INR",

        darkMode: false,

        birthday: ""

    };


    document.body.classList.remove(
        "dark"
    );


    const darkToggle =
        document.getElementById(
            "darkModeToggle"
        );


    const currencySelect =
        document.getElementById(
            "currencySelect"
        );


    const birthdayInput =
        document.getElementById(
            "birthdayInput"
        );


    if (darkToggle) {

        darkToggle.checked =
            false;

    }


    if (currencySelect) {

        currencySelect.value =
            "INR";

    }


    if (birthdayInput) {

        birthdayInput.value =
            "";

    }


    updateCurrencyUI();

    renderHistory();

    updateDashboard();

    showToast(
        "All data cleared"
    );

}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    setText(
        "totalBills",
        bills.length
    );


    const totalSaved =
        bills.reduce(
            (
                sum,
                bill
            ) =>

                sum +

                Number(
                    bill.discount || 0
                ) +

                Number(
                    bill.couponDiscount || 0
                ),

            0
        );


    setText(
        "totalSaved",
        formatMoney(
            totalSaved
        )
    );


    renderRecentBills();

}


/* =========================
   SHARING
========================= */

function generateShareText(
    bill
) {

    const symbol =
        currencies[
            bill.currency
        ] ||
        "₹";


    const platformFee =
        Number(
            bill.platformFee ??
            bill.gst ??
            0
        );


    const platformFeeRate =
        Number(
            bill.platformFeeRate ??
            bill.gstRate ??
            2
        );


    let text =
        "🧾 BillSplit\n\n";


    text +=
        `${bill.name}\n`;


    text +=
        `${formatDateTime(
            bill.date
        )}\n\n`;


    text +=
        `Bill Amount: ${symbol}${Number(
            bill.subtotal || 0
        ).toFixed(2)}\n`;


    text +=
        `Platform Fee (${platformFeeRate}%): ${symbol}${platformFee.toFixed(2)}\n`;


    text +=
        `Tip: ${symbol}${Number(
            bill.tip || 0
        ).toFixed(2)}\n`;


    text +=
        `Discount: -${symbol}${Number(
            bill.discount || 0
        ).toFixed(2)}\n`;


    if (bill.coupon) {

        text +=
            `Coupon (${bill.coupon}): -${symbol}${Number(
                bill.couponDiscount || 0
            ).toFixed(2)}\n`;

    }


    text +=
        `\nTotal: ${symbol}${Number(
            bill.total || 0
        ).toFixed(2)}\n\n`;


    text +=
        "People:\n";


    if (
        Array.isArray(
            bill.people
        )
    ) {

        bill.people.forEach(
            person => {

                text +=
                    `${person.name}: ${symbol}${Number(
                        person.amount || 0
                    ).toFixed(2)} ${
                        person.paid
                            ? "✓ Paid"
                            : "Unpaid"
                    }\n`;

            }
        );

    }


    text +=
        "\nSplit with BillSplit";


    return text;

}


async function shareBill(
    id
) {

    const bill =
        bills.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!bill) return;


    const text =
        generateShareText(
            bill
        );


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "BillSplit Bill",

                text:
                    text

            });

            return;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                return;

            }

        }

    }


    await copyToClipboard(
        text
    );


    showToast(
        "Bill copied to clipboard"
    );

}


function shareWhatsApp(
    id
) {

    const bill =
        bills.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!bill) return;


    const text =
        generateShareText(
            bill
        );


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(
            text
        );


    const popup =
        window.open(
            url,
            "_blank"
        );


    if (!popup) {

        window.location.href =
            url;

    }

}


/* =========================
   HELPERS
========================= */

function getBillAmount() {

    const input =
        document.getElementById(
            "billAmount"
        );


    const amount =
        input
            ? parseFloat(
                input.value
            )
            : 0;


    return Number.isFinite(
        amount
    )
        ? Math.max(
            0,
            amount
        )
        : 0;

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function getCurrencySymbol() {

    return (
        currencies[
            settings.currency
        ] ||
        "₹"
    );

}


function formatMoney(
    amount
) {

    return (
        getCurrencySymbol() +
        Number(
            amount || 0
        ).toFixed(2)
    );

}


function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatDateTime(
    dateString
) {

    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


async function copyToClipboard(
    text
) {

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return true;

        }

    } catch (error) {}


    try {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";


        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.focus();

        textarea.select();


        const successful =
            document.execCommand(
                "copy"
            );


        textarea.remove();


        return successful;

    } catch (error) {

        return false;

    }

}


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.billSplitToastTimer
    );


    window.billSplitToastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}
