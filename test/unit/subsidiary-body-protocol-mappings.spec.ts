import { describe, it, expect } from "vitest";
import mapIdentifier, {
  subsidiaryBodyToSubject,
  subjectToSubsidiaryBody,
  getAllSubsidiaryBodyIdentifiers,
  getAllSubjectIdentifiers,
  isSubsidiaryBodyIdentifier,
  isSubjectIdentifier,
} from "shared/utils/subsidiary-body-protocol-mappings";

describe("subsidiary-body-protocol-mappings", () => {
  describe("subsidiaryBodyToSubject", () => {
    it("should map CAL-SUBSIDIARY-BODY-SBI to CBD-SUBJECT-SBI", () => {
      expect(subsidiaryBodyToSubject("CAL-SUBSIDIARY-BODY-SBI")).toBe(
        "CBD-SUBJECT-SBI",
      );
    });

    it("should map short name SBI to CBD-SUBJECT-SBI", () => {
      expect(subsidiaryBodyToSubject("SBI")).toBe("CBD-SUBJECT-SBI");
    });

    it("should map CAL-SUBSIDIARY-BODY-SBSTTA to CBD-SUBJECT-SBSTTA", () => {
      expect(subsidiaryBodyToSubject("CAL-SUBSIDIARY-BODY-SBSTTA")).toBe(
        "CBD-SUBJECT-SBSTTA",
      );
    });

    it("should map short name SBSTTA to CBD-SUBJECT-SBSTTA", () => {
      expect(subsidiaryBodyToSubject("SBSTTA")).toBe("CBD-SUBJECT-SBSTTA");
    });

    it("should map CP (Cartagena Protocol) to CBD-SUBJECT-CPB", () => {
      expect(subsidiaryBodyToSubject("CP")).toBe("CBD-SUBJECT-CPB");
      expect(subsidiaryBodyToSubject("CAL-SUBSIDIARY-BODY-CP")).toBe(
        "CBD-SUBJECT-CPB",
      );
    });

    it("should map NP (Nagoya Protocol) to CBD-SUBJECT-NPB", () => {
      expect(subsidiaryBodyToSubject("NP")).toBe("CBD-SUBJECT-NPB");
      expect(subsidiaryBodyToSubject("CAL-SUBSIDIARY-BODY-NP")).toBe(
        "CBD-SUBJECT-NPB",
      );
    });

    it("should map 8J (Article 8(j)) to CBD-SUBJECT-8J", () => {
      expect(subsidiaryBodyToSubject("8J")).toBe("CBD-SUBJECT-8J");
      expect(subsidiaryBodyToSubject("CAL-SUBSIDIARY-BODY-8J")).toBe(
        "CBD-SUBJECT-8J",
      );
    });

    it("should return undefined for unmapped identifiers", () => {
      expect(subsidiaryBodyToSubject("UNKNOWN")).toBeUndefined();
      expect(subsidiaryBodyToSubject("RANDOM-ID")).toBeUndefined();
    });

    it("should handle whitespace by trimming", () => {
      expect(subsidiaryBodyToSubject("  SBI  ")).toBe("CBD-SUBJECT-SBI");
      expect(subsidiaryBodyToSubject(" CAL-SUBSIDIARY-BODY-SBSTTA ")).toBe(
        "CBD-SUBJECT-SBSTTA",
      );
    });

    it("should return undefined for empty or null input", () => {
      expect(subsidiaryBodyToSubject("")).toBeUndefined();
      expect(
        subsidiaryBodyToSubject(null as unknown as string),
      ).toBeUndefined();
      expect(
        subsidiaryBodyToSubject(undefined as unknown as string),
      ).toBeUndefined();
    });
  });

  describe("subjectToSubsidiaryBody", () => {
    it("should map CBD-SUBJECT-SBI to SBI", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-SBI")).toBe("SBI");
    });

    it("should map CBD-SUBJECT-SBSTTA to SBSTTA", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-SBSTTA")).toBe("SBSTTA");
    });

    it("should map CBD-SUBJECT-CPB to CP", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-CPB")).toBe("CP");
    });

    it("should map CBD-SUBJECT-NPB to NP", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-NPB")).toBe("NP");
    });

    it("should map CBD-SUBJECT-8J to 8J", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-8J")).toBe("8J");
    });

    it("should map CBD-SUBJECT-COP to COP", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-COP")).toBe("COP");
    });

    it("should return undefined for non-subsidiary-body subjects", () => {
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-ABS")).toBeUndefined();
      expect(subjectToSubsidiaryBody("CBD-SUBJECT-KMGBF")).toBeUndefined();
    });

    it("should return undefined for unmapped identifiers", () => {
      expect(subjectToSubsidiaryBody("UNKNOWN")).toBeUndefined();
    });

    it("should handle whitespace by trimming", () => {
      expect(subjectToSubsidiaryBody("  CBD-SUBJECT-SBI  ")).toBe("SBI");
      expect(subjectToSubsidiaryBody(" CBD-SUBJECT-CPB ")).toBe("CP");
    });

    it("should return undefined for empty or null input", () => {
      expect(subjectToSubsidiaryBody("")).toBeUndefined();
      expect(
        subjectToSubsidiaryBody(null as unknown as string),
      ).toBeUndefined();
      expect(
        subjectToSubsidiaryBody(undefined as unknown as string),
      ).toBeUndefined();
    });
  });

  describe("mapIdentifier (default export)", () => {
    it("should map subsidiary body identifiers to subjects", () => {
      expect(mapIdentifier("SBI")).toBe("CBD-SUBJECT-SBI");
      expect(mapIdentifier("CAL-SUBSIDIARY-BODY-SBI")).toBe("CBD-SUBJECT-SBI");
      expect(mapIdentifier("SBSTTA")).toBe("CBD-SUBJECT-SBSTTA");
      expect(mapIdentifier("CP")).toBe("CBD-SUBJECT-CPB");
      expect(mapIdentifier("NP")).toBe("CBD-SUBJECT-NPB");
    });

    it("should map subject identifiers to subsidiary bodies", () => {
      expect(mapIdentifier("CBD-SUBJECT-SBI")).toBe("SBI");
      expect(mapIdentifier("CBD-SUBJECT-SBSTTA")).toBe("SBSTTA");
      expect(mapIdentifier("CBD-SUBJECT-CPB")).toBe("CP");
      expect(mapIdentifier("CBD-SUBJECT-NPB")).toBe("NP");
      expect(mapIdentifier("CBD-SUBJECT-8J")).toBe("8J");
    });

    it("should be bidirectional", () => {
      // SBI → CBD-SUBJECT-SBI → SBI
      const subjectId = mapIdentifier("SBI");

      expect(subjectId).toBe("CBD-SUBJECT-SBI");
      expect(mapIdentifier(subjectId!)).toBe("SBI");

      // CBD-SUBJECT-CPB → CP → CBD-SUBJECT-CPB
      const subsidiaryBodyId = mapIdentifier("CBD-SUBJECT-CPB");

      expect(subsidiaryBodyId).toBe("CP");
      expect(mapIdentifier(subsidiaryBodyId!)).toBe("CBD-SUBJECT-CPB");
    });

    it("should return undefined for unmapped identifiers", () => {
      expect(mapIdentifier("UNKNOWN")).toBeUndefined();
      expect(mapIdentifier("CBD-SUBJECT-ABS")).toBeUndefined();
    });

    it("should handle whitespace", () => {
      expect(mapIdentifier("  SBI  ")).toBe("CBD-SUBJECT-SBI");
      expect(mapIdentifier(" CBD-SUBJECT-SBI ")).toBe("SBI");
    });

    it("should return undefined for empty or null input", () => {
      expect(mapIdentifier("")).toBeUndefined();
      expect(mapIdentifier(null as unknown as string)).toBeUndefined();
      expect(mapIdentifier(undefined as unknown as string)).toBeUndefined();
    });
  });

  describe("getAllSubsidiaryBodyIdentifiers", () => {
    it("should return all subsidiary body short names", () => {
      const identifiers = getAllSubsidiaryBodyIdentifiers();

      expect(identifiers).toContain("SBI");
      expect(identifiers).toContain("SBSTTA");
      expect(identifiers).toContain("CP");
      expect(identifiers).toContain("NP");
      expect(identifiers).toContain("8J");
      expect(identifiers).toContain("COP");
      expect(identifiers.length).toBeGreaterThan(0);
    });

    it("should return an array", () => {
      expect(Array.isArray(getAllSubsidiaryBodyIdentifiers())).toBe(true);
    });
  });

  describe("getAllSubjectIdentifiers", () => {
    it("should return all subject identifiers that map to subsidiary bodies", () => {
      const identifiers = getAllSubjectIdentifiers();

      expect(identifiers).toContain("CBD-SUBJECT-SBI");
      expect(identifiers).toContain("CBD-SUBJECT-SBSTTA");
      expect(identifiers).toContain("CBD-SUBJECT-CPB");
      expect(identifiers).toContain("CBD-SUBJECT-NPB");
      expect(identifiers).toContain("CBD-SUBJECT-8J");
      expect(identifiers).toContain("CBD-SUBJECT-COP");
      expect(identifiers.length).toBeGreaterThan(0);
    });

    it("should return an array", () => {
      expect(Array.isArray(getAllSubjectIdentifiers())).toBe(true);
    });
  });

  describe("isSubsidiaryBodyIdentifier", () => {
    it("should return true for valid subsidiary body identifiers", () => {
      expect(isSubsidiaryBodyIdentifier("SBI")).toBe(true);
      expect(isSubsidiaryBodyIdentifier("CAL-SUBSIDIARY-BODY-SBI")).toBe(true);
      expect(isSubsidiaryBodyIdentifier("SBSTTA")).toBe(true);
      expect(isSubsidiaryBodyIdentifier("CP")).toBe(true);
      expect(isSubsidiaryBodyIdentifier("NP")).toBe(true);
      expect(isSubsidiaryBodyIdentifier("8J")).toBe(true);
    });

    it("should return false for subject identifiers", () => {
      expect(isSubsidiaryBodyIdentifier("CBD-SUBJECT-SBI")).toBe(false);
      expect(isSubsidiaryBodyIdentifier("CBD-SUBJECT-CPB")).toBe(false);
    });

    it("should return false for unmapped identifiers", () => {
      expect(isSubsidiaryBodyIdentifier("UNKNOWN")).toBe(false);
      expect(isSubsidiaryBodyIdentifier("RANDOM")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isSubsidiaryBodyIdentifier("  SBI  ")).toBe(true);
    });

    it("should return false for empty or null input", () => {
      expect(isSubsidiaryBodyIdentifier("")).toBe(false);
      expect(isSubsidiaryBodyIdentifier(null as unknown as string)).toBe(false);
      expect(isSubsidiaryBodyIdentifier(undefined as unknown as string)).toBe(
        false,
      );
    });
  });

  describe("isSubjectIdentifier", () => {
    it("should return true for valid subject identifiers that map to subsidiary bodies", () => {
      expect(isSubjectIdentifier("CBD-SUBJECT-SBI")).toBe(true);
      expect(isSubjectIdentifier("CBD-SUBJECT-SBSTTA")).toBe(true);
      expect(isSubjectIdentifier("CBD-SUBJECT-CPB")).toBe(true);
      expect(isSubjectIdentifier("CBD-SUBJECT-NPB")).toBe(true);
      expect(isSubjectIdentifier("CBD-SUBJECT-8J")).toBe(true);
      expect(isSubjectIdentifier("CBD-SUBJECT-COP")).toBe(true);
    });

    it("should return false for subsidiary body identifiers", () => {
      expect(isSubjectIdentifier("SBI")).toBe(false);
      expect(isSubjectIdentifier("CAL-SUBSIDIARY-BODY-SBI")).toBe(false);
    });

    it("should return false for subject identifiers without subsidiary body mappings", () => {
      expect(isSubjectIdentifier("CBD-SUBJECT-ABS")).toBe(false);
      expect(isSubjectIdentifier("CBD-SUBJECT-KMGBF")).toBe(false);
    });

    it("should return false for unmapped identifiers", () => {
      expect(isSubjectIdentifier("UNKNOWN")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isSubjectIdentifier("  CBD-SUBJECT-SBI  ")).toBe(true);
    });

    it("should return false for empty or null input", () => {
      expect(isSubjectIdentifier("")).toBe(false);
      expect(isSubjectIdentifier(null as unknown as string)).toBe(false);
      expect(isSubjectIdentifier(undefined as unknown as string)).toBe(false);
    });
  });

  describe("edge cases and comprehensive mapping verification", () => {
    it("should ensure all mappings are bidirectional", () => {
      const subsidiaryBodies = getAllSubsidiaryBodyIdentifiers();
      const subjects = getAllSubjectIdentifiers();

      // Verify each subject maps back to a subsidiary body
      for (const subjectId of subjects) {
        const subsidiaryBodyId = subjectToSubsidiaryBody(subjectId);

        expect(subsidiaryBodyId).toBeDefined();
        expect(subsidiaryBodies).toContain(subsidiaryBodyId!);
      }
    });

    it("should handle all known mappings", () => {
      const knownMappings = [
        { subsidiaryBody: "SBI", subject: "CBD-SUBJECT-SBI" },
        { subsidiaryBody: "SBSTTA", subject: "CBD-SUBJECT-SBSTTA" },
        { subsidiaryBody: "CP", subject: "CBD-SUBJECT-CPB" },
        { subsidiaryBody: "NP", subject: "CBD-SUBJECT-NPB" },
        { subsidiaryBody: "8J", subject: "CBD-SUBJECT-8J" },
        { subsidiaryBody: "COP", subject: "CBD-SUBJECT-COP" },
      ];

      for (const mapping of knownMappings) {
        expect(subsidiaryBodyToSubject(mapping.subsidiaryBody)).toBe(
          mapping.subject,
        );
        expect(subjectToSubsidiaryBody(mapping.subject)).toBe(
          mapping.subsidiaryBody,
        );
        expect(mapIdentifier(mapping.subsidiaryBody)).toBe(mapping.subject);
        expect(mapIdentifier(mapping.subject)).toBe(mapping.subsidiaryBody);
      }
    });
  });
});
