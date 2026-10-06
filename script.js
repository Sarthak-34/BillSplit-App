/* =========================================================
   BillSplit
   Vanilla JavaScript
   ========================================================= */


/* =========================
   GLOBAL DATA
========================= */

const GST_RATE = 2;

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

let bills = JSON.parse(localStorage.getItem("billsplit_bills")) || [];

let settings = JSON.parse(
    localStorage.getItem("billsplit_settings")
) || {
    currency: "INR",
    darkMode: false,
    birthday: ""
};

let couponHistory = JSON.parse(
    localStorage.getItem("billsplit_coupon_history")
) || [];

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

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    updateCurrencyUI();

    renderCoupons();

    renderHistory();

    updateDashboard();

    resetPeople();

});


/* =========================
   STORAGE
========================= */

function saveBills() {

    localStorage.setItem(
        "billsplit_bills",
        JSON.stringify(bills)
    );

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

    document.getElementById("currencySelect").value =
        settings.currency;

    document.getElementById("birthdayInput").value =
        settings.birthday || "";

    document.getElementById("darkModeToggle").checked =
        settings.darkMode;

    if (settings.darkMode) {

        document.body.classList.add("dark");

    }

}


function changeCurrency() {

    const select = document.getElementById("currencySelect");

    settings.currency = select.value;

    saveSettings();

    updateCurrencyUI();

    calculateBill();

    renderHistory();

    updateDashboard();

    showToast("Currency updated");

}


function updateCurrencyUI() {

    const symbol =
        currencies[settings.currency] || "₹";

    document.getElementById("currencySymbol").textContent =
        symbol;

}


function toggleDarkMode() {

    settings.darkMode =
        document.getElementById("darkModeToggle").checked;

    document.body.classList.toggle(
        "dark",
        settings.darkMode
    );

    saveSettings();

}


function saveBirthday() {

    settings.birthday =
        document.getElementById("birthdayInput").value;

    saveSettings();

    showToast("Birthday saved");

}


/* =========================
   NAVIGATION
========================= */

function showPage(pageId, navButton = null) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active");

    });

    const page =
        document.getElementById(pageId);

    if (page) {

        page.classList.add("active");

    }


    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.remove("active");

    });


    if (navButton) {

        navButton.classList.add("active");

    } else {

        const matchingButton =
            document.querySelector(
                `.nav-item[onclick*="'${pageId}'"]`
            );

        if (matchingButton) {

            matchingButton.classList.add("active");

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

    showPage("calculatorPage");

}


function resetCalculator() {

    document.getElementById("billName").value = "";

    document.getElementById("billAmount").value = "";

    selectedTip = 0;

    customTipValue = null;

    appliedCoupon = null;

    billPhotoData = null;

    document.getElementById("billPreview").style.display =
        "none";

    document.getElementById("removePhotoBtn").style.display =
        "none";

    document.querySelectorAll(".tip-btn").forEach(btn => {

        btn.classList.remove("active");

    });

    document.querySelector(".tip-btn").classList.add("active");

    resetPeople();

    updateAppliedCouponUI();

    calculateBill();

}


function calculateBill() {

    const amount =
        parseFloat(
            document.getElementById("billAmount").value
        ) || 0;


    /* GST */

    const gst =
        amount * (GST_RATE / 100);


    /* TIP */

    let tipPercent = selectedTip;

    let tipAmount =
        amount * (tipPercent / 100);

    if (customTipValue !== null) {

        tipAmount =
            amount * (customTipValue / 100);

    }


    /* AUTOMATIC DISCOUNT */

    const discountPercent =
        getDiscountPercent(amount);

    const discountAmount =
        amount * (discountPercent / 100);


    /* COUPON */

    let couponDiscount = 0;

    if (appliedCoupon) {

        couponDiscount =
            calculateCouponDiscount(
                appliedCoupon,
                amount
            );

    }


    /* FINAL */

    const finalTotal =
        Math.max(
            0,
            amount +
            gst +
            tipAmount -
            discountAmount -
            couponDiscount
        );


    /* UI */

    const symbol =
        currencies[settings.currency];


    document.getElementById("gstAmount").textContent =
        formatMoney(gst);


    document.getElementById("tipAmount").textContent =
        formatMoney(tipAmount);


    document.getElementById("discountPercent").textContent =
        discountPercent + "%";


    document.getElementById("discountAmount").textContent =
        formatMoney(discountAmount);


    document.getElementById("discountMessage").textContent =
        getDiscountMessage(amount);


    document.getElementById("summarySubtotal").textContent =
        formatMoney(amount);


    document.getElementById("summaryGST").textContent =
        formatMoney(gst);


    document.getElementById("summaryTip").textContent =
        formatMoney(tipAmount);


    document.getElementById("summaryDiscount").textContent =
        "-" + formatMoney(discountAmount);


    document.getElementById("summaryCoupon").textContent =
        "-" + formatMoney(couponDiscount);


    document.getElementById("finalTotal").textContent =
        formatMoney(finalTotal);


    updatePeopleAmounts(finalTotal);

}


/* =========================
   GST
========================= */

function calculateGST(amount) {

    return amount * (GST_RATE / 100);

}


/* =========================
   TIP
========================= */

function selectTip(percent, button) {

    selectedTip = percent;

    customTipValue = null;

    document.querySelectorAll(".tip-btn").forEach(btn => {

        btn.classList.remove("active");

    });

    button.classList.add("active");

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
        isNaN(percent) ||
        percent < 0
    ) {

        showToast("Enter a valid tip percentage");

        return;

    }

    selectedTip = 0;

    customTipValue = percent;


    document.querySelectorAll(".tip-btn").forEach(btn => {

        btn.classList.remove("active");

    });


    calculateBill();

    showToast(`Custom tip ${percent}% applied`);

}


/* =========================
   AUTOMATIC DISCOUNT
========================= */

function getDiscountPercent(amount) {

    /*
        Below 1000 = 0%
        1000 to 2499 = 5%
        2500 to 3499 = 15%
        3500 to 4999 = 20%
        5000+ = 25%
    */

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


function getDiscountMessage(amount) {

    if (amount <= 0) {

        return "Add bill amount to calculate discount.";

    }

    if (amount < 1000) {

        return "Spend ₹1,000 or more to get 5% discount.";

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

function isCouponExpired(coupon) {

    const today =
        new Date();

    const expiry =
        new Date(coupon.expiry);

    expiry.setHours(
        23,
        59,
        59,
        999
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

    const today =
        new Date();

    const birthday =
        new Date(
            settings.birthday + "T00:00:00"
        );

    return (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() === birthday.getDate()
    );

}


function validateCoupon(coupon) {

    const amount =
        parseFloat(
            document.getElementById("billAmount").value
        ) || 0;


    if (isCouponExpired(coupon)) {

        return "This coupon has expired.";

    }


    if (amount < coupon.minBill) {

        return `Minimum bill amount is ${formatMoney(coupon.minBill)}.`;

    }


    if (coupon.firstBillOnly && !isFirstBill()) {

        return "This coupon is only available for your first bill.";

    }


    if (
        coupon.birthdayOnly &&
        !isBirthdayEligible()
    ) {

        return "This coupon is only available on your birthday.";

    }


    return null;

}


function calculateCouponDiscount(coupon, amount) {

    let discount = 0;


    if (coupon.type === "percentage") {

        discount =
            amount * (coupon.value / 100);

    } else {

        discount =
            coupon.value;

    }


    if (
        coupon.maxDiscount &&
        discount > coupon.maxDiscount
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
        .getElementById("couponModal")
        .classList.add("active");

}


function closeCouponModal() {

    document
        .getElementById("couponModal")
        .classList.remove("active");

}


function renderCoupons() {

    const container =
        document.getElementById("couponList");

    container.innerHTML = "";


    const activeCoupons =
        coupons.filter(
            coupon => !isCouponExpired(coupon)
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


    activeCoupons.forEach(coupon => {

        container.innerHTML +=
            createCouponHTML(coupon);

    });

}


function renderModalCoupons() {

    const container =
        document.getElementById("modalCouponList");

    container.innerHTML = "";


    coupons.forEach(coupon => {

        if (isCouponExpired(coupon)) return;

        container.innerHTML +=
            createCouponHTML(
                coupon,
                true
            );

    });

}


function createCouponHTML(coupon, modal = false) {

    let badges = "";

    if (coupon.featured) {

        badges += `<span>FEATURED</span>`;

    }

    if (coupon.limitedTime) {

        badges += `<span>LIMITED TIME</span>`;

    }

    if (coupon.firstBillOnly) {

        badges += `<span>FIRST BILL</span>`;

    }

    if (coupon.birthdayOnly) {

        badges += `<span>BIRTHDAY</span>`;

    }


    const discountText =
        coupon.type === "percentage"
            ? `${coupon.value}% OFF`
            : `${formatMoney(coupon.value)} OFF`;


    return `
        <div class="coupon-card">

            <div class="coupon-top">

                <div>
                    <div class="coupon-code">
                        ${coupon.code}
                    </div>

                    <p>
                        ${coupon.description}
                    </p>
                </div>

                <div class="coupon-discount">
                    ${discountText}
                </div>

            </div>


            <div class="coupon-meta">

                ${badges}

                <span>
                    Min ${formatMoney(coupon.minBill)}
                </span>

                <span>
                    Expires ${formatDate(coupon.expiry)}
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


function applyCoupon(code) {

    const coupon =
        coupons.find(
            item => item.code === code
        );


    if (!coupon) {

        showToast("Coupon not found");

        return;

    }


    const error =
        validateCoupon(coupon);


    if (error) {

        showToast(error);

        return;

    }


    /*
        Only one coupon at a time.
        Applying another coupon replaces
        the current coupon.
    */

    appliedCoupon = coupon;

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

    showToast("Coupon removed");

}


function updateAppliedCouponUI() {

    const container =
        document.getElementById("appliedCoupon");


    if (!appliedCoupon) {

        container.classList.add("hidden");

        container.innerHTML = "";

        return;

    }


    const amount =
        parseFloat(
            document.getElementById("billAmount").value
        ) || 0;


    const discount =
        calculateCouponDiscount(
            appliedCoupon,
            amount
        );


    container.classList.remove("hidden");

    container.innerHTML = `
        <strong>
            🎟️ ${appliedCoupon.code}
        </strong>

        <span>
            Saving ${formatMoney(discount)}
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
            id: Date.now(),
            name: "Person 1",
            amount: 0,
            paid: false
        }
    ];

    renderPeople();

}


function addPerson() {

    people.push({
        id: Date.now() + Math.random(),
        name: `Person ${people.length + 1}`,
        amount: 0,
        paid: false
    });

    renderPeople();

    calculateBill();

}


function removePerson(id) {

    if (people.length <= 1) {

        showToast("At least one person is required.");

        return;

    }


    people =
        people.filter(
            person => person.id !== id
        );

    renderPeople();

    calculateBill();

}


function setSplitMode(mode) {

    splitMode = mode;


    document
        .getElementById("equalSplitBtn")
        .classList.toggle(
            "active",
            mode === "equal"
        );


    document
        .getElementById("customSplitBtn")
        .classList.toggle(
            "active",
            mode === "custom"
        );


    renderPeople();

    calculateBill();

}


function updatePeopleAmounts(total) {

    if (!people.length) return;


    if (splitMode === "equal") {

        const amount =
            total / people.length;


        people.forEach(person => {

            person.amount =
                Number(amount.toFixed(2));

        });

    }


    renderPeople();

}


function renderPeople() {

    const container =
        document.getElementById("peopleList");


    container.innerHTML = "";


    people.forEach(person => {

        const amountValue =
            person.amount || 0;


        container.innerHTML += `
            <div class="person-row">

                <input
                    type="text"
                    value="${escapeHTML(person.name)}"
                    placeholder="Person name"
                    onchange="updatePersonName('${person.id}',this.value)"
                >

                <input
                    type="number"
                    value="${amountValue.toFixed(2)}"
                    ${splitMode === "equal" ? "readonly" : ""}
                    onchange="updatePersonAmount('${person.id}',this.value)"
                >

                <button
                    class="person-status ${
                        person.paid
                            ? "paid"
                            : "unpaid"
                    }"
                    onclick="togglePaid('${person.id}')"
                >
                    ${person.paid ? "Paid" : "Unpaid"}
                </button>

            </div>
        `;

    });


    updatePaymentSummary();

}


function updatePersonName(id, value) {

    const person =
        people.find(
            item => String(item.id) === String(id)
        );


    if (person) {

        person.name =
            value.trim() || "Unnamed";

    }

}


function updatePersonAmount(id, value) {

    const person =
        people.find(
            item => String(item.id) === String(id)
        );


    if (person) {

        person.amount =
            parseFloat(value) || 0;

    }


    updatePaymentSummary();

}


function togglePaid(id) {

    const person =
        people.find(
            item => String(item.id) === String(id)
        );


    if (!person) return;


    person.paid =
        !person.paid;


    renderPeople();

}


function updatePaymentSummary() {

    const paid =
        people
            .filter(person => person.paid)
            .reduce(
                (sum, person) =>
                    sum + Number(person.amount || 0),
                0
            );


    const total =
        people.reduce(
            (sum, person) =>
                sum + Number(person.amount || 0),
            0
        );


    const finalTotal =
        parseDisplayedMoney(
            document.getElementById("finalTotal").textContent
        );


    let remaining;


    if (splitMode === "custom") {

        remaining =
            Math.max(
                0,
                finalTotal - paid
            );

    } else {

        remaining =
            Math.max(
                0,
                total - paid
            );

    }


    document.getElementById("paidAmount").textContent =
        formatMoney(paid);

    document.getElementById("remainingAmount").textContent =
        formatMoney(remaining);

}


/* =========================
   BILL PHOTO
========================= */

function openCamera() {

    document
        .getElementById("billPhoto")
        .click();

}


document
    .getElementById("billPhoto")
    .addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];

            if (!file) return;


            if (!file.type.startsWith("image/")) {

                showToast("Please select an image.");

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function(e) {

                    billPhotoData =
                        e.target.result;


                    const preview =
                        document.getElementById(
                            "billPreview"
                        );


                    preview.src =
                        billPhotoData;

                    preview.style.display =
                        "block";


                    document
                        .getElementById(
                            "removePhotoBtn"
                        )
                        .style.display =
                        "block";


                    showToast(
                        "Bill photo added"
                    );

                };


            reader.readAsDataURL(file);

        }
    );


function removeBillPhoto() {

    billPhotoData = null;

    document
        .getElementById("billPhoto")
        .value = "";

    document
        .getElementById("billPreview")
        .style.display = "none";

    document
        .getElementById("removePhotoBtn")
        .style.display = "none";

}


/* =========================
   SAVE BILL
========================= */

function saveBill() {

    const name =
        document
            .getElementById("billName")
            .value.trim();


    const amount =
        parseFloat(
            document
                .getElementById("billAmount")
                .value
        ) || 0;


    if (!name) {

        showToast("Please enter a bill name.");

        return;

    }


    if (amount <= 0) {

        showToast("Please enter a valid bill amount.");

        return;

    }


    const gst =
        calculateGST(amount);


    let tip =
        amount *
        (
            customTipValue !== null
                ? customTipValue
                : selectedTip
        ) / 100;


    const discountPercent =
        getDiscountPercent(amount);


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
            gst +
            tip -
            discount -
            couponDiscount
        );


    /* Validate custom split */

    if (splitMode === "custom") {

        const peopleTotal =
            people.reduce(
                (sum, person) =>
                    sum +
                    Number(person.amount || 0),
                0
            );


        if (
            Math.abs(
                peopleTotal - total
            ) > 0.01
        ) {

            showToast(
                `People amounts must equal ${formatMoney(total)}`
            );

            return;

        }

    } else {

        const each =
            total / people.length;


        people.forEach(person => {

            person.amount =
                Number(each.toFixed(2));

        });

    }


    const bill = {

        id:
            Date.now().toString(),

        name,

        date:
            new Date().toISOString(),

        subtotal:
            Number(amount.toFixed(2)),

        gstRate:
            GST_RATE,

        gst:
            Number(gst.toFixed(2)),

        tip:
            Number(tip.toFixed(2)),

        tipPercent:
            customTipValue !== null
                ? customTipValue
                : selectedTip,

        discountPercent,

        discount:
            Number(discount.toFixed(2)),

        coupon:
            appliedCoupon
                ? appliedCoupon.code
                : null,

        couponDiscount:
            Number(couponDiscount.toFixed(2)),

        total:
            Number(total.toFixed(2)),

        currency:
            settings.currency,

        people:
            JSON.parse(
                JSON.stringify(people)
            ),

        photo:
            billPhotoData

    };


    bills.unshift(bill);

    saveBills();


    /* Coupon history */

    if (appliedCoupon) {

        couponHistory.unshift({

            id: Date.now(),

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


    showToast("Bill saved successfully!");

    updateDashboard();

    renderHistory();


    setTimeout(() => {

        showPage("homePage");

    }, 700);

}


/* =========================
   HISTORY
========================= */

function renderHistory() {

    const container =
        document.getElementById("historyList");


    container.innerHTML = "";


    if (!bills.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🧾</div>
                <h3>No bills yet</h3>
                <p>Your saved bills will appear here.</p>
            </div>
        `;

        return;

    }


    bills.forEach(bill => {

        container.innerHTML +=
            createBillCard(bill);

    });


    renderRecentBills();

}


function renderRecentBills() {

    const container =
        document.getElementById("recentBills");


    const recent =
        bills.slice(0, 3);


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🧾</div>
                <h3>No bills yet</h3>
                <p>Create your first bill to see it here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        recent
            .map(bill => createBillCard(bill))
            .join("");

}


function createBillCard(bill) {

    const symbol =
        currencies[bill.currency] ||
        currencies[settings.currency];


    return `
        <div
            class="bill-card"
            onclick="openBillDetails('${bill.id}')"
        >

            <div class="bill-card-top">

                <div>

                    <h3>
                        ${escapeHTML(bill.name)}
                    </h3>

                    <div class="date">
                        ${formatDateTime(bill.date)}
                    </div>

                </div>

                <div class="bill-total">
                    ${symbol}${bill.total.toFixed(2)}
                </div>

            </div>


            <div class="bill-card-bottom">

                <span>
                    👥 ${bill.people.length} people
                </span>

                <span>
                    ${bill.coupon
                        ? "🎟️ " + bill.coupon
                        : "No coupon"}
                </span>

            </div>

        </div>
    `;

}


function openBillDetails(id) {

    const bill =
        bills.find(
            item => item.id === id
        );


    if (!bill) return;


    const symbol =
        currencies[bill.currency] ||
        "₹";


    const peopleHTML =
        bill.people
            .map(person => `
                <div class="detail-row">

                    <span>
                        ${escapeHTML(person.name)}
                    </span>

                    <strong>
                        ${symbol}${person.amount.toFixed(2)}
                        ${person.paid ? " ✓" : ""}
                    </strong>

                </div>
            `)
            .join("");


    document.getElementById(
        "billDetails"
    ).innerHTML = `

        <div class="detail-section">

            <h3>
                ${escapeHTML(bill.name)}
            </h3>

            <p class="muted">
                ${formatDateTime(bill.date)}
            </p>

        </div>


        <div class="detail-section">

            <div class="detail-row">
                <span>Bill Amount</span>
                <strong>${symbol}${bill.subtotal.toFixed(2)}</strong>
            </div>

            <div class="detail-row">
                <span>GST (${bill.gstRate}%)</span>
                <strong>${symbol}${bill.gst.toFixed(2)}</strong>
            </div>

            <div class="detail-row">
                <span>Tip</span>
                <strong>${symbol}${bill.tip.toFixed(2)}</strong>
            </div>

            <div class="detail-row">
                <span>Discount (${bill.discountPercent}%)</span>
                <strong>-${symbol}${bill.discount.toFixed(2)}</strong>
            </div>

            <div class="detail-row">
                <span>Coupon</span>
                <strong>
                    -${symbol}${bill.couponDiscount.toFixed(2)}
                </strong>
            </div>

            <div class="detail-row detail-total">
                <span>Total</span>
                <strong>${symbol}${bill.total.toFixed(2)}</strong>
            </div>

        </div>


        <div class="detail-section">

            <h3>People</h3>

            ${peopleHTML}

        </div>


        <button
            class="primary-btn big-btn"
            onclick="shareBill('${bill.id}')"
        >
            📤 Share Bill
        </button>

        <button
            class="primary-btn big-btn"
            style="margin-top:8px;background:#25D366;"
            onclick="shareWhatsApp('${bill.id}')"
        >
            🟢 Share on WhatsApp
        </button>

        <button
            class="small-btn danger"
            style="width:100%;margin-top:8px;"
            onclick="deleteBill('${bill.id}')"
        >
            🗑️ Delete Bill
        </button>

    `;


    document
        .getElementById("billDetailsModal")
        .classList.add("active");

}


function closeBillDetails() {

    document
        .getElementById("billDetailsModal")
        .classList.remove("active");

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
            bill => bill.id !== id
        );


    saveBills();

    closeBillDetails();

    renderHistory();

    updateDashboard();

    showToast("Bill deleted");

}


/* =========================
   CLEAR DATA
========================= */

function clearHistory() {

    if (!bills.length) {

        showToast("No bills to clear");

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

    showToast("Bill history cleared");

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


    document.body.classList.remove("dark");

    document.getElementById(
        "darkModeToggle"
    ).checked = false;


    document.getElementById(
        "currencySelect"
    ).value = "INR";


    document.getElementById(
        "birthdayInput"
    ).value = "";


    renderHistory();

    updateDashboard();

    updateCurrencyUI();

    showToast("All data cleared");

}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    document.getElementById(
        "totalBills"
    ).textContent =
        bills.length;


    const totalSaved =
        bills.reduce(
            (sum, bill) =>
                sum +
                bill.discount +
                bill.couponDiscount,
            0
        );


    document.getElementById(
        "totalSaved"
    ).textContent =
        formatMoney(totalSaved);


    renderRecentBills();

}


/* =========================
   SHARING
========================= */

function generateShareText(bill) {

    const symbol =
        currencies[bill.currency] ||
        "₹";


    let text = "";

    text += "🧾 BillSplit\n\n";

    text += `${bill.name}\n`;

    text += `${formatDateTime(bill.date)}\n\n`;

    text += `Bill Amount: ${symbol}${bill.subtotal.toFixed(2)}\n`;

    text += `GST: ${symbol}${bill.gst.toFixed(2)}\n`;

    text += `Tip: ${symbol}${bill.tip.toFixed(2)}\n`;

    text += `Discount: -${symbol}${bill.discount.toFixed(2)}\n`;

    if (bill.coupon) {

        text += `Coupon (${bill.coupon}): -${symbol}${bill.couponDiscount.toFixed(2)}\n`;

    }

    text += `\nTotal: ${symbol}${bill.total.toFixed(2)}\n\n`;

    text += "People:\n";


    bill.people.forEach(person => {

        text +=
            `${person.name}: ${symbol}${person.amount.toFixed(2)} ${person.paid ? "✓ Paid" : "Unpaid"}\n`;

    });


    text += "\nSplit with BillSplit";

    return text;

}


async function shareBill(id) {

    const bill =
        bills.find(
            item => item.id === id
        );


    if (!bill) return;


    const text =
        generateShareText(bill);


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title: "BillSplit Bill",

                text

            });

        } catch (error) {

            /* User cancelled share */

        }

    } else {

        copyToClipboard(text);

        showToast(
            "Bill copied to clipboard"
        );

    }

}


function shareWhatsApp(id) {

    const bill =
        bills.find(
            item => item.id === id
        );


    if (!bill) return;


    const text =
        generateShareText(bill);


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(text);


    window.open(
        url,
        "_blank"
    );

}


/* =========================
   HELPERS
========================= */

function formatMoney(amount) {

    const symbol =
        currencies[settings.currency] ||
        "₹";


    return (
        symbol +
        Number(amount || 0)
            .toFixed(2)
    );

}


function parseDisplayedMoney(text) {

    if (!text) return 0;


    return (
        parseFloat(
            String(text)
                .replace(/[^\d.-]/g, "")
        ) || 0
    );

}


function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatDateTime(dateString) {

    const date =
        new Date(dateString);


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


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


async function copyToClipboard(text) {

    try {

        await navigator.clipboard.writeText(text);

    } catch (error) {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

    }

}


function showToast(message) {

    const toast =
        document.getElementById("toast");


    toast.textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}
