/* =========================================================
   BillSplit JavaScript
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const PLATFORM_FEE_RATE = 2;

const BILLS_KEY = "billsplit_bills";
const SETTINGS_KEY = "billsplit_settings";


/* =========================================================
   CURRENCY
========================================================= */

const currencies = {
    INR: {
        symbol: "₹",
        name: "Indian Rupee"
    },

    USD: {
        symbol: "$",
        name: "US Dollar"
    },

    EUR: {
        symbol: "€",
        name: "Euro"
    },

    GBP: {
        symbol: "£",
        name: "British Pound"
    },

    AED: {
        symbol: "د.إ",
        name: "UAE Dirham"
    },

    CAD: {
        symbol: "$",
        name: "Canadian Dollar"
    },

    AUD: {
        symbol: "$",
        name: "Australian Dollar"
    },

    SGD: {
        symbol: "$",
        name: "Singapore Dollar"
    }
};


/* =========================================================
   COUPONS
========================================================= */

const coupons = [

    {
        code: "WELCOME50",
        title: "₹50 OFF",
        description: "Get ₹50 off on your bill.",
        type: "flat",
        value: 50,
        minAmount: 300,
        maxDiscount: 50
    },

    {
        code: "SAVE20",
        title: "20% OFF",
        description: "Save 20% on your bill.",
        type: "percent",
        value: 20,
        minAmount: 500,
        maxDiscount: 200
    },

    {
        code: "FIRSTBILL25",
        title: "25% OFF",
        description: "Special discount for your first bill.",
        type: "percent",
        value: 25,
        minAmount: 400,
        maxDiscount: 300
    },

    {
        code: "BIRTHDAY30",
        title: "30% OFF",
        description: "Birthday special discount.",
        type: "percent",
        value: 30,
        minAmount: 500,
        maxDiscount: 500
    },

    {
        code: "FLASH100",
        title: "₹100 OFF",
        description: "Get ₹100 off on large bills.",
        type: "flat",
        value: 100,
        minAmount: 1000,
        maxDiscount: 100
    }

];


/* =========================================================
   STATE
========================================================= */

let people = [];

let splitMode = "equal";

let selectedTip = 0;

let appliedCoupon = null;

let billPhoto = "";

let currentCurrency = "INR";

let currentBillId = null;


/* =========================================================
   STORAGE
========================================================= */

function getBills() {

    try {

        return JSON.parse(
            localStorage.getItem(BILLS_KEY)
        ) || [];

    } catch (error) {

        return [];

    }
}


function saveBills(bills) {

    localStorage.setItem(
        BILLS_KEY,
        JSON.stringify(bills)
    );

}


function getSettings() {

    try {

        return JSON.parse(
            localStorage.getItem(SETTINGS_KEY)
        ) || {};

    } catch (error) {

        return {};

    }

}


function saveSettings(settings) {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadSettings();

        initializePeople();

        renderCoupons();

        renderHistory();

        updateDashboard();

        calculateBill();

    }
);


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {

        page.classList.remove("active");

    });


    const target = document.getElementById(pageId);

    if (target) {

        target.classList.add("active");

    }


    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {

        item.classList.remove("active");

        if (
            item.dataset.page === pageId
        ) {

            item.classList.add("active");

        }

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "homePage") {

        updateDashboard();

    }

    if (pageId === "historyPage") {

        renderHistory();

    }

    if (pageId === "couponsPage") {

        renderCoupons();

    }

}


/* =========================================================
   START NEW BILL
========================================================= */

function startNewBill() {

    resetBill();

    showPage("calculatorPage");

}


/* =========================================================
   RESET BILL
========================================================= */

function resetBill() {

    const billName =
        document.getElementById("billName");

    const billAmount =
        document.getElementById("billAmount");

    const customTip =
        document.getElementById("customTip");

    if (billName) {

        billName.value = "";

    }

    if (billAmount) {

        billAmount.value = "";

    }

    if (customTip) {

        customTip.value = "";

    }


    selectedTip = 0;

    appliedCoupon = null;

    billPhoto = "";

    currentBillId = null;

    splitMode = "equal";

    initializePeople();

    updateTipButtons();

    updateAppliedCoupon();

    removeBillPhoto();

    calculateBill();

}


/* =========================================================
   CURRENCY
========================================================= */

function getCurrencySymbol() {

    return currencies[currentCurrency]?.symbol || "₹";

}


function formatMoney(amount) {

    const value = Number(amount) || 0;

    return (
        getCurrencySymbol() +
        value.toFixed(2)
    );

}


function changeCurrency(currency) {

    if (!currencies[currency]) {

        return;

    }

    currentCurrency = currency;

    const settings = getSettings();

    settings.currency = currency;

    saveSettings(settings);

    updateCurrencyUI();

    calculateBill();

    renderHistory();

    showToast("Currency updated");

}


function updateCurrencyUI() {

    const symbol =
        document.getElementById("currencySymbol");

    if (symbol) {

        symbol.textContent =
            getCurrencySymbol();

    }


    const select =
        document.getElementById("currencySelect");

    if (select) {

        select.value = currentCurrency;

    }

}


/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

    const settings = getSettings();


    if (settings.currency) {

        currentCurrency =
            settings.currency;

    }


    updateCurrencyUI();


    const darkToggle =
        document.getElementById(
            "darkModeToggle"
        );

    if (settings.darkMode) {

        document.body.classList.add("dark");

        if (darkToggle) {

            darkToggle.checked = true;

        }

    }


    const birthday =
        document.getElementById(
            "birthdayInput"
        );

    if (
        birthday &&
        settings.birthday
    ) {

        birthday.value =
            settings.birthday;

    }

}


function toggleDarkMode() {

    const toggle =
        document.getElementById(
            "darkModeToggle"
        );

    const enabled =
        toggle?.checked || false;

    document.body.classList.toggle(
        "dark",
        enabled
    );


    const settings = getSettings();

    settings.darkMode = enabled;

    saveSettings(settings);

}


function saveBirthday() {

    const birthday =
        document.getElementById(
            "birthdayInput"
        );

    const settings = getSettings();

    settings.birthday =
        birthday?.value || "";

    saveSettings(settings);

    showToast(
        "Birthday saved"
    );

}


/* =========================================================
   PEOPLE
========================================================= */

function initializePeople() {

    people = [

        {
            id: createId(),
            name: "Person 1",
            amount: 0,
            paid: false
        },

        {
            id: createId(),
            name: "Person 2",
            amount: 0,
            paid: false
        }

    ];

    renderPeople();

}


function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


function addPerson() {

    people.push({

        id: createId(),

        name:
            "Person " +
            (people.length + 1),

        amount: 0,

        paid: false

    });


    renderPeople();

    calculateBill();

}


function removePerson(id) {

    if (people.length <= 1) {

        showToast(
            "At least one person is required"
        );

        return;

    }


    people =
        people.filter(function (person) {

            return person.id !== id;

        });


    renderPeople();

    calculateBill();

}


function setSplitMode(mode) {

    splitMode = mode;

    const equalBtn =
        document.getElementById(
            "equalSplitBtn"
        );

    const customBtn =
        document.getElementById(
            "customSplitBtn"
        );


    equalBtn?.classList.toggle(
        "active",
        mode === "equal"
    );

    customBtn?.classList.toggle(
        "active",
        mode === "custom"
    );


    calculateBill();

    renderPeople();

}


function togglePaid(id) {

    const person =
        people.find(function (p) {

            return p.id === id;

        });


    if (!person) {

        return;

    }


    person.paid =
        !person.paid;


    renderPeople();

    calculateBill();

}


function updatePersonName(
    id,
    value
) {

    const person =
        people.find(function (p) {

            return p.id === id;

        });


    if (person) {

        person.name =
            value.trim() ||
            "Unnamed";

    }

}


function updatePersonAmount(
    id,
    value
) {

    const person =
        people.find(function (p) {

            return p.id === id;

        });


    if (!person) {

        return;

    }


    person.amount =
        Math.max(
            0,
            Number(value) || 0
        );


    splitMode = "custom";

    document
        .getElementById(
            "equalSplitBtn"
        )
        ?.classList.remove("active");

    document
        .getElementById(
            "customSplitBtn"
        )
        ?.classList.add("active");


    calculateBill();

}


function renderPeople() {

    const container =
        document.getElementById(
            "peopleList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    people.forEach(function (person) {

        const row =
            document.createElement("div");

        row.className =
            "person-row";


        const nameInput =
            document.createElement("input");

        nameInput.type = "text";

        nameInput.value =
            person.name;

        nameInput.placeholder =
            "Name";

        nameInput.oninput =
            function () {

                updatePersonName(
                    person.id,
                    this.value
                );

            };


        const amountInput =
            document.createElement("input");

        amountInput.type = "number";

        amountInput.min = "0";

        amountInput.step = "0.01";

        amountInput.value =
            person.amount.toFixed(2);

        amountInput.disabled =
            splitMode === "equal";

        amountInput.oninput =
            function () {

                updatePersonAmount(
                    person.id,
                    this.value
                );

            };


        const paidButton =
            document.createElement("button");

        paidButton.type = "button";

        paidButton.className =
            "person-status " +
            (
                person.paid
                    ? "paid"
                    : "unpaid"
            );

        paidButton.textContent =
            person.paid
                ? "✓ Paid"
                : "Mark as Paid";

        paidButton.onclick =
            function () {

                togglePaid(
                    person.id
                );

            };


        const removeButton =
            document.createElement("button");

        removeButton.type = "button";

        removeButton.className =
            "person-remove";

        removeButton.textContent =
            "×";

        removeButton.onclick =
            function () {

                removePerson(
                    person.id
                );

            };


        row.appendChild(nameInput);

        row.appendChild(amountInput);

        row.appendChild(paidButton);

        row.appendChild(removeButton);

        container.appendChild(row);

    });

}


/* =========================================================
   TIP
========================================================= */

function setTip(value) {

    selectedTip = value;

    updateTipButtons();

    const customBox =
        document.getElementById(
            "customTipBox"
        );


    if (value === "custom") {

        customBox?.classList.remove(
            "hidden"
        );

    } else {

        customBox?.classList.add(
            "hidden"
        );

    }


    calculateBill();

}


function updateTipButtons() {

    const buttons =
        document.querySelectorAll(
            ".tip-btn"
        );


    buttons.forEach(function (button) {

        const value =
            button.dataset.tip;


        let active = false;


        if (
            selectedTip === "custom" &&
            value === "custom"
        ) {

            active = true;

        } else if (
            String(selectedTip) === value
        ) {

            active = true;

        }


        button.classList.toggle(
            "active",
            active
        );

    });

}


/* =========================================================
   DISCOUNT
========================================================= */

function getAutomaticDiscountRate(
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


/* =========================================================
   COUPON DISCOUNT
========================================================= */

function getCouponDiscount(
    amount
) {

    if (!appliedCoupon) {

        return 0;

    }


    const coupon =
        appliedCoupon;


    if (
        amount <
        coupon.minAmount
    ) {

        return 0;

    }


    let discount = 0;


    if (
        coupon.type === "flat"
    ) {

        discount =
            coupon.value;

    } else {

        discount =
            amount *
            coupon.value /
            100;

    }


    if (
        coupon.maxDiscount
    ) {

        discount =
            Math.min(
                discount,
                coupon.maxDiscount
            );

    }


    return discount;

}


/* =========================================================
   CALCULATE BILL
========================================================= */

function calculateBill() {

    const amountInput =
        document.getElementById(
            "billAmount"
        );


    const amount =
        Math.max(
            0,
            Number(
                amountInput?.value
            ) || 0
        );


    /*
       Platform Fee = 2%
    */

    const platformFee =
        amount *
        PLATFORM_FEE_RATE /
        100;


    /*
       Automatic Discount
    */

    const discountRate =
        getAutomaticDiscountRate(
            amount
        );


    const automaticDiscount =
        amount *
        discountRate /
        100;


    /*
       Coupon
    */

    const couponDiscount =
        getCouponDiscount(
            amount
        );


    /*
       Tip
    */

    let tipRate = 0;


    if (
        selectedTip === "custom"
    ) {

        tipRate =
            Math.max(
                0,
                Number(
                    document.getElementById(
                        "customTip"
                    )?.value
                ) || 0
            );

    } else {

        tipRate =
            Number(selectedTip) || 0;

    }


    const tip =
        amount *
        tipRate /
        100;


    /*
       Final total
    */

    const totalDiscount =
        Math.min(
            amount,
            automaticDiscount +
            couponDiscount
        );


    const finalTotal =
        Math.max(
            0,
            amount +
            platformFee +
            tip -
            totalDiscount
        );


    /*
       Update UI
    */

    setText(
        "platformFeeAmount",
        formatMoney(platformFee)
    );

    setText(
        "tipAmount",
        formatMoney(tip)
    );

    setText(
        "discountPercent",
        discountRate + "%"
    );

    setText(
        "discountAmount",
        formatMoney(
            automaticDiscount
        )
    );

    setText(
        "summaryBillAmount",
        formatMoney(amount)
    );

    setText(
        "summaryPlatformFee",
        formatMoney(platformFee)
    );

    setText(
        "summaryTip",
        formatMoney(tip)
    );

    setText(
        "summaryDiscount",
        "-" +
        formatMoney(totalDiscount)
    );

    setText(
        "finalTotal",
        formatMoney(finalTotal)
    );


    /*
       Equal split
    */

    if (
        splitMode === "equal" &&
        people.length > 0
    ) {

        const each =
            finalTotal /
            people.length;


        people.forEach(
            function (person) {

                person.amount =
                    each;

            }
        );


        renderPeople();

    }


    /*
       Paid calculation
    */

    const paidAmount =
        people.reduce(
            function (sum, person) {

                return (
                    sum +
                    (
                        person.paid
                            ? Number(person.amount) || 0
                            : 0
                    )
                );

            },
            0
        );


    const remaining =
        Math.max(
            0,
            finalTotal -
            paidAmount
        );


    setText(
        "paidAmount",
        formatMoney(paidAmount)
    );

    setText(
        "remainingAmount",
        formatMoney(remaining)
    );


    updateAppliedCoupon();


    return {

        amount,

        platformFee,

        tip,

        automaticDiscount,

        couponDiscount,

        totalDiscount,

        finalTotal,

        tipRate,

        discountRate

    };

}


/* =========================================================
   HELPER TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


/* =========================================================
   COUPONS RENDER
========================================================= */

function renderCoupons() {

    const container =
        document.getElementById(
            "couponList"
        );


    const modalContainer =
        document.getElementById(
            "couponModalList"
        );


    const html =
        coupons.map(
            function (coupon) {

                return couponHTML(
                    coupon
                );

            }
        ).join("");


    if (container) {

        container.innerHTML = html;

    }

    if (modalContainer) {

        modalContainer.innerHTML =
            coupons.map(
                function (coupon) {

                    return couponModalHTML(
                        coupon
                    );

                }
            ).join("");

    }

}


function couponHTML(coupon) {

    const discountText =
        coupon.type === "flat"
            ? formatMoney(coupon.value) +
              " OFF"
            : coupon.value +
              "% OFF";


    return `

        <div class="coupon-card">

            <div class="coupon-top">

                <div>

                    <div class="coupon-code">
                        ${escapeHTML(coupon.code)}
                    </div>

                    <p>
                        ${escapeHTML(coupon.description)}
                    </p>

                </div>

                <div class="coupon-discount">
                    ${discountText}
                </div>

            </div>

            <div class="coupon-meta">

                <span>
                    Min ${formatMoney(coupon.minAmount)}
                </span>

                <span>
                    Max ${formatMoney(coupon.maxDiscount)}
                </span>

            </div>

            <button
                class="coupon-apply"
                onclick="applyCoupon('${coupon.code}')"
            >
                Apply Coupon
            </button>

        </div>

    `;

}


function couponModalHTML(coupon) {

    return `

        <div class="coupon-card">

            <div class="coupon-top">

                <div>

                    <div class="coupon-code">
                        ${escapeHTML(coupon.code)}
                    </div>

                    <p>
                        ${escapeHTML(coupon.description)}
                    </p>

                </div>

                <div class="coupon-discount">

                    ${
                        coupon.type === "flat"
                            ? formatMoney(coupon.value) + " OFF"
                            : coupon.value + "% OFF"
                    }

                </div>

            </div>

            <div class="coupon-meta">

                <span>
                    Min ${formatMoney(coupon.minAmount)}
                </span>

                <span>
                    Max ${formatMoney(coupon.maxDiscount)}
                </span>

            </div>

            <button
                class="coupon-apply"
                onclick="applyCoupon('${coupon.code}')"
            >
                Apply
            </button>

        </div>

    `;

}


/* =========================================================
   APPLY COUPON
========================================================= */

function applyCoupon(code) {

    const coupon =
        coupons.find(
            function (item) {

                return item.code === code;

            }
        );


    if (!coupon) {

        return;

    }


    const amount =
        Number(
            document.getElementById(
                "billAmount"
            )?.value
        ) || 0;


    if (
        amount <
        coupon.minAmount
    ) {

        showToast(
            "Minimum bill amount is " +
            formatMoney(
                coupon.minAmount
            )
        );

        return;

    }


    /*
       First bill coupon
    */

    if (
        coupon.code ===
        "FIRSTBILL25"
    ) {

        const bills =
            getBills();

        if (bills.length > 0) {

            showToast(
                "This coupon is only for your first bill"
            );

            return;

        }

    }


    /*
       Birthday coupon
    */

    if (
        coupon.code ===
        "BIRTHDAY30"
    ) {

        const settings =
            getSettings();


        if (!settings.birthday) {

            showToast(
                "Set your birthday in Settings first"
            );

            return;

        }


        const birthday =
            new Date(
                settings.birthday
            );

        const today =
            new Date();


        if (
            birthday.getMonth() !==
                today.getMonth() ||
            birthday.getDate() !==
                today.getDate()
        ) {

            showToast(
                "Birthday coupon is not available today"
            );

            return;

        }

    }


    appliedCoupon =
        coupon;


    updateAppliedCoupon();

    calculateBill();

    closeCouponModal();

    showToast(
        coupon.code +
        " applied"
    );

}


/* =========================================================
   UPDATE COUPON
========================================================= */

function updateAppliedCoupon() {

    const box =
        document.getElementById(
            "appliedCoupon"
        );

    const code =
        document.getElementById(
            "appliedCouponCode"
        );

    const text =
        document.getElementById(
            "appliedCouponText"
        );


    if (!box) {

        return;

    }


    if (!appliedCoupon) {

        box.classList.add(
            "hidden"
        );

        return;

    }


    box.classList.remove(
        "hidden"
    );


    if (code) {

        code.textContent =
            appliedCoupon.code;

    }


    if (text) {

        text.textContent =
            appliedCoupon.description;

    }

}


function removeCoupon() {

    appliedCoupon = null;

    updateAppliedCoupon();

    calculateBill();

    showToast(
        "Coupon removed"
    );

}


/* =========================================================
   COUPON MODAL
========================================================= */

function openCouponModal() {

    renderCoupons();

    document
        .getElementById(
            "couponModal"
        )
        ?.classList.add("active");

}


function closeCouponModal() {

    document
        .getElementById(
            "couponModal"
        )
        ?.classList.remove("active");

}


/* =========================================================
   BILL PHOTO
========================================================= */

function handleBillPhoto(event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            billPhoto =
                e.target.result;


            const preview =
                document.getElementById(
                    "billPreview"
                );


            const removeButton =
                document.getElementById(
                    "removePhotoBtn"
                );


            if (preview) {

                preview.src =
                    billPhoto;

                preview.style.display =
                    "block";

            }


            if (removeButton) {

                removeButton.style.display =
                    "block";

            }

        };


    reader.readAsDataURL(file);

}


function removeBillPhoto() {

    billPhoto = "";


    const preview =
        document.getElementById(
            "billPreview"
        );


    const removeButton =
        document.getElementById(
            "removePhotoBtn"
        );


    const input =
        document.getElementById(
            "billPhoto"
        );


    if (preview) {

        preview.src = "";

        preview.style.display =
            "none";

    }


    if (removeButton) {

        removeButton.style.display =
            "none";

    }


    if (input) {

        input.value = "";

    }

}


/* =========================================================
   SAVE BILL
========================================================= */

function saveBill() {

    const nameInput =
        document.getElementById(
            "billName"
        );


    const amountInput =
        document.getElementById(
            "billAmount"
        );


    const name =
        nameInput?.value.trim() ||
        "Untitled Bill";


    const amount =
        Number(
            amountInput?.value
        ) || 0;


    if (amount <= 0) {

        showToast(
            "Please enter a bill amount"
        );

        return;

    }


    const calculation =
        calculateBill();


    const bill = {

        id:
            currentBillId ||
            createId(),

        name,

        amount,

        platformFee:
            calculation.platformFee,

        platformFeeRate:
            PLATFORM_FEE_RATE,

        tip:
            calculation.tip,

        tipRate:
            calculation.tipRate,

        automaticDiscount:
            calculation.automaticDiscount,

        discountRate:
            calculation.discountRate,

        couponDiscount:
            calculation.couponDiscount,

        coupon:
            appliedCoupon
                ? appliedCoupon.code
                : null,

        totalDiscount:
            calculation.totalDiscount,

        finalTotal:
            calculation.finalTotal,

        people:
            people.map(
                function (person) {

                    return {

                        id: person.id,

                        name: person.name,

                        amount:
                            Number(
                                person.amount
                            ) || 0,

                        paid:
                            Boolean(
                                person.paid
                            )

                    };

                }
            ),

        photo:
            billPhoto || "",

        currency:
            currentCurrency,

        createdAt:
            new Date().toISOString()

    };


    const bills =
        getBills();


    const existingIndex =
        bills.findIndex(
            function (item) {

                return item.id === bill.id;

            }
        );


    if (
        existingIndex >= 0
    ) {

        bills[existingIndex] =
            bill;

    } else {

        bills.unshift(bill);

    }


    saveBills(bills);


    currentBillId =
        bill.id;


    updateDashboard();

    renderHistory();


    showToast(
        "Bill saved successfully"
    );

}


/* =========================================================
   SHARE BILL
========================================================= */

function createShareText() {

    const name =
        document.getElementById(
            "billName"
        )?.value.trim() ||
        "BillSplit Bill";


    const calculation =
        calculateBill();


    let text = "";

    text +=
        "🧾 BillSplit Bill\n\n";

    text +=
        "Bill: " +
        name +
        "\n";

    text +=
        "Bill Amount: " +
        formatMoney(
            calculation.amount
        ) +
        "\n";

    text +=
        "Platform Fee (2%): " +
        formatMoney(
            calculation.platformFee
        ) +
        "\n";

    text +=
        "Tip: " +
        formatMoney(
            calculation.tip
        ) +
        "\n";

    text +=
        "Discount: -" +
        formatMoney(
            calculation.totalDiscount
        ) +
        "\n";

    text +=
        "Final Total: " +
        formatMoney(
            calculation.finalTotal
        ) +
        "\n\n";


    text +=
        "👥 People:\n";


    people.forEach(
        function (person) {

            text +=
                person.name +
                " - " +
                formatMoney(
                    person.amount
                ) +
                " - " +
                (
                    person.paid
                        ? "Paid"
                        : "Unpaid"
                ) +
                "\n";

        }
    );


    text +=
        "\nGenerated with BillSplit";

    return text;

}


async function shareCurrentBill() {

    const text =
        createShareText();


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "BillSplit Bill",

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


    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Bill copied to clipboard"
        );

    } catch (error) {

        showToast(
            "Unable to share bill"
        );

    }

}


/* =========================================================
   WHATSAPP
========================================================= */

function shareWhatsApp() {

    const text =
        createShareText();


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(text);


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    const recent =
        document.getElementById(
            "recentBills"
        );


    const bills =
        getBills();


    if (container) {

        if (
            bills.length === 0
        ) {

            container.innerHTML =
                emptyBillsHTML();

        } else {

            container.innerHTML =
                bills
                    .map(
                        function (bill) {

                            return billCardHTML(
                                bill
                            );

                        }
                    )
                    .join("");

        }

    }


    if (recent) {

        const latest =
            bills.slice(
                0,
                3
            );


        if (
            latest.length === 0
        ) {

            recent.innerHTML =
                emptyBillsHTML();

        } else {

            recent.innerHTML =
                latest
                    .map(
                        function (bill) {

                            return billCardHTML(
                                bill
                            );

                        }
                    )
                    .join("");

        }

    }

}


function emptyBillsHTML() {

    return `

        <div class="empty-state">

            <div>
                🧾
            </div>

            <h3>
                No bills yet
            </h3>

            <p>
                Create your first bill to see it here.
            </p>

        </div>

    `;

}


function billCardHTML(bill) {

    const date =
        new Date(
            bill.createdAt
        ).toLocaleString();


    const paid =
        (bill.people || [])
            .filter(
                function (person) {

                    return person.paid;

                }
            ).length;


    const totalPeople =
        (bill.people || []).length;


    return `

        <div
            class="bill-card"
            onclick="openBillDetails('${bill.id}')"
        >

            <div class="bill-card-top">

                <div>

                    <h3>
                        ${escapeHTML(
                            bill.name ||
                            "Untitled Bill"
                        )}
                    </h3>

                    <div class="date">
                        ${date}
                    </div>

                </div>

                <div class="bill-total">
                    ${formatMoney(
                        bill.finalTotal
                    )}
                </div>

            </div>


            <div class="bill-card-bottom">

                <span>
                    ${totalPeople} people
                </span>

                <span>
                    ${paid}/${totalPeople} paid
                </span>

                <span>
                    ${bill.coupon || "No coupon"}
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const bills =
        getBills();


    setText(
        "totalBills",
        bills.length
    );


    const totalSaved =
        bills.reduce(
            function (sum, bill) {

                return (
                    sum +
                    (
                        Number(
                            bill.totalDiscount
                        ) || 0
                    )
                );

            },
            0
        );


    setText(
        "totalSaved",
        formatMoney(totalSaved)
    );


    renderHistory();

}


/* =========================================================
   BILL DETAILS
========================================================= */

function openBillDetails(id) {

    const bills =
        getBills();


    const bill =
        bills.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!bill) {

        return;

    }


    const container =
        document.getElementById(
            "billDetailsContent"
        );


    if (!container) {

        return;

    }


    const billCurrency =
        bill.currency ||
        currentCurrency;


    const symbol =
        currencies[billCurrency]?.symbol ||
        getCurrencySymbol();


    const money =
        function (value) {

            return (
                symbol +
                (
                    Number(value) || 0
                ).toFixed(2)
            );

        };


    const peopleHTML =
        (bill.people || [])
            .map(
                function (person) {

                    return `

                        <div class="detail-person">

                            <span>
                                ${escapeHTML(
                                    person.name
                                )}
                            </span>

                            <span>
                                ${money(
                                    person.amount
                                )}
                            </span>

                            <span class="${
                                person.paid
                                    ? "paid-label"
                                    : "unpaid-label"
                            }">
                                ${
                                    person.paid
                                        ? "✓ Paid"
                                        : "Unpaid"
                                }
                            </span>

                        </div>

                    `;

                }
            )
            .join("");


    container.innerHTML = `

        <div class="detail-section">

            <div class="detail-row">

                <span>
                    Bill Name
                </span>

                <strong>
                    ${escapeHTML(
                        bill.name ||
                        "Untitled Bill"
                    )}
                </strong>

            </div>

            <div class="detail-row">

                <span>
                    Bill Amount
                </span>

                <strong>
                    ${money(
                        bill.amount
                    )}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <div class="detail-row">

                <span>
                    Platform Fee (2%)
                </span>

                <span>
                    ${money(
                        bill.platformFee
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span>
                    Tip
                </span>

                <span>
                    ${money(
                        bill.tip
                    )}
                </span>

            </div>


            <div class="detail-row">

                <span>
                    Discount
                </span>

                <span>
                    -${money(
                        bill.totalDiscount
                    )}
                </span>

            </div>


            <div class="detail-total">

                Final Total:

                <strong>
                    ${money(
                        bill.finalTotal
                    )}
                </strong>

            </div>

        </div>


        <div class="detail-section">

            <h3>
                👥 People
            </h3>

            ${peopleHTML}

        </div>


        ${
            bill.photo
                ? `
                    <div class="detail-section">

                        <h3>
                            📷 Bill Photo
                        </h3>

                        <img
                            src="${bill.photo}"
                            class="bill-preview"
                            style="display:block;"
                            alt="Saved bill photo"
                        >

                    </div>
                `
                : ""
        }


        <button
            class="danger-btn"
            onclick="deleteBill('${bill.id}')"
        >
            Delete Bill
        </button>

    `;


    document
        .getElementById(
            "billDetailsModal"
        )
        ?.classList.add("active");

}


function closeBillDetails() {

    document
        .getElementById(
            "billDetailsModal"
        )
        ?.classList.remove("active");

}


/* =========================================================
   DELETE BILL
========================================================= */

function deleteBill(id) {

    if (
        !confirm(
            "Delete this bill?"
        )
    ) {

        return;

    }


    let bills =
        getBills();


    bills =
        bills.filter(
            function (bill) {

                return bill.id !== id;

            }
        );


    saveBills(bills);

    closeBillDetails();

    renderHistory();

    updateDashboard();

    showToast(
        "Bill deleted"
    );

}


/* =========================================================
   CLEAR ALL BILLS
========================================================= */

function clearAllBills() {

    const bills =
        getBills();


    if (
        bills.length === 0
    ) {

        showToast(
            "No bills to clear"
        );

        return;

    }


    if (
        !confirm(
            "Clear all saved bills?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        BILLS_KEY
    );


    renderHistory();

    updateDashboard();

    showToast(
        "All bills cleared"
    );

}


/* =========================================================
   CLEAR ALL DATA
========================================================= */

function clearAllData() {

    if (
        !confirm(
            "Delete all BillSplit data?"
        )
    ) {

        return;

    }


    localStorage.removeItem(
        BILLS_KEY
    );

    localStorage.removeItem(
        SETTINGS_KEY
    );


    location.reload();

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList.contains(
                "modal"
            )
        ) {

            event.target.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal.active"
                )
                .forEach(
                    function (modal) {

                        modal.classList.remove(
                            "active"
                        );

                    }
                );

        }

    }
);
