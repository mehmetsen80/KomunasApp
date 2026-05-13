package org.lite.komunas.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Maps the exact Form, Category, and Office codes used by the USCIS Processing Times API
 * to their human-readable equivalents for tracking and UI presentation.
 */
@Getter
@RequiredArgsConstructor
public enum USCISTrackableForm {

    // 134A-F21: Permanent resident filing for a spouse or child under 21
    I130_PR_SPOUSE_CHILD_FOD("I-130", "134A-F21", "FOD", "Form I-130 | Petition for Alien Relative", "Permanent resident filing for a spouse or child under 21", "All Field Offices"),
    I130_PR_SPOUSE_CHILD_NBC("I-130", "134A-F21", "NBC", "Form I-130 | Petition for Alien Relative", "Permanent resident filing for a spouse or child under 21", "National Benefits Center"),
    I130_PR_SPOUSE_CHILD_SCOPS("I-130", "134A-F21", "SCD", "Form I-130 | Petition for Alien Relative", "Permanent resident filing for a spouse or child under 21", "Service Center Operations (SCOPS)"),

    // 134A-IR: U.S. citizen filing for a spouse, parent, or child under 21
    I130_USC_SPOUSE_PARENT_CHILD_FOD("I-130", "134A-IR", "FOD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a spouse, parent, or child under 21", "All Field Offices"),
    I130_USC_SPOUSE_PARENT_CHILD_NBC("I-130", "134A-IR", "NBC", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a spouse, parent, or child under 21", "National Benefits Center"),
    I130_USC_SPOUSE_PARENT_CHILD_SCOPS("I-130", "134A-IR", "SCD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a spouse, parent, or child under 21", "Service Center Operations (SCOPS)"),

    // 134B-F11: U.S. citizen filing for unmarried son/daughter 21 or older
    I130_USC_UNMARRIED_SON_DAUGHTER_FOD("I-130", "134B-F11", "FOD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for unmarried son/daughter 21 or older", "All Field Offices"),
    I130_USC_UNMARRIED_SON_DAUGHTER_NBC("I-130", "134B-F11", "NBC", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for unmarried son/daughter 21 or older", "National Benefits Center"),
    I130_USC_UNMARRIED_SON_DAUGHTER_SCOPS("I-130", "134B-F11", "SCD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for unmarried son/daughter 21 or older", "Service Center Operations (SCOPS)"),

    // 134B-F24: Permanent resident for unmarried son or daughter 21 or older
    I130_PR_UNMARRIED_SON_DAUGHTER_FOD("I-130", "134B-F24", "FOD", "Form I-130 | Petition for Alien Relative", "Permanent resident for unmarried son or daughter 21 or older", "All Field Offices"),
    I130_PR_UNMARRIED_SON_DAUGHTER_NBC("I-130", "134B-F24", "NBC", "Form I-130 | Petition for Alien Relative", "Permanent resident for unmarried son or daughter 21 or older", "National Benefits Center"),
    I130_PR_UNMARRIED_SON_DAUGHTER_SCOPS("I-130", "134B-F24", "SCD", "Form I-130 | Petition for Alien Relative", "Permanent resident for unmarried son or daughter 21 or older", "Service Center Operations (SCOPS)"),

    // 134B-F31: U.S. citizen filing for a married son or daughter
    I130_USC_MARRIED_SON_DAUGHTER_FOD("I-130", "134B-F31", "FOD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a married son or daughter", "All Field Offices"),
    I130_USC_MARRIED_SON_DAUGHTER_NBC("I-130", "134B-F31", "NBC", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a married son or daughter", "National Benefits Center"),
    I130_USC_MARRIED_SON_DAUGHTER_SCOPS("I-130", "134B-F31", "SCD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a married son or daughter", "Service Center Operations (SCOPS)"),

    // 134B-F41: U.S. citizen filing for a brother or sister
    I130_USC_BROTHER_SISTER_FOD("I-130", "134B-F41", "FOD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a brother or sister", "All Field Offices"),
    I130_USC_BROTHER_SISTER_NBC("I-130", "134B-F41", "NBC", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a brother or sister", "National Benefits Center"),
    I130_USC_BROTHER_SISTER_SCOPS("I-130", "134B-F41", "SCD", "Form I-130 | Petition for Alien Relative", "U.S. citizen filing for a brother or sister", "Service Center Operations (SCOPS)"),

    // Core generic forms
    I485_NBC("I-485", null, "NBC", "Form I-485 | Application to Register Permanent Residence or Adjust Status", "All Categories", "National Benefits Center"),
    I765_NBC("I-765", null, "NBC", "Form I-765 | Application for Employment Authorization", "All Categories", "National Benefits Center"),
    I140_TSC("I-140", null, "TSC", "Form I-140 | Immigrant Petition for Alien Worker", "All Categories", "Texas Service Center");

    private final String formId;
    private final String categoryCode;
    private final String officeCode;
    
    private final String formName;
    private final String categoryName;
    private final String officeName;
}
