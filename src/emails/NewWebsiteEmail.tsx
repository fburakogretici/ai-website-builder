import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface NewWebsiteEmailProps {
    websiteName?: string;
    websiteUrl?: string;
    thumbnailUrl?: string;
}

export const NewWebsiteEmail = ({
    websiteName = "My Awesome Site",
    websiteUrl = "https://nocodepage.vercel.app",
    thumbnailUrl = "https://placehold.co/600x400/e2e8f0/475569?text=Website+Preview",
}: NewWebsiteEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your new website "{websiteName}" is ready!</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="mx-auto my-10 bg-white rounded-lg shadow-lg overflow-hidden max-w-[600px]">
                        {/* Header */}
                        <Section className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center">
                            <Img
                                src="https://i.ibb.co/jPzT7f0w/nocodepage-logo.png"
                                alt="NoCodePage"
                                height="50"
                                className="mx-auto"
                            />
                        </Section>

                        {/* Content */}
                        <Section className="p-8">
                            <Heading className="text-2xl font-bold text-gray-800 mb-4 text-center">
                                Your Website is Ready! 🚀
                            </Heading>
                            <Text className="text-gray-600 text-base mb-6 leading-relaxed text-center">
                                Great news! Your new website <strong>{websiteName}</strong> has been successfully created and is ready for you to customize.
                            </Text>

                            <Section className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
                                <Img
                                    src={thumbnailUrl}
                                    alt="Website Preview"
                                    width="100%"
                                    className="w-full object-cover"
                                />
                            </Section>

                            <Section className="text-center mb-8">
                                <Button
                                    className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition-colors"
                                    href={websiteUrl}
                                >
                                    View & Edit Website
                                </Button>
                            </Section>

                            <Text className="text-gray-500 text-xs text-center border-t border-gray-200 pt-8">
                                You received this email because you have "New Website" notifications enabled.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-gray-50 p-6 text-center border-t border-gray-200">
                            <Text className="text-gray-400 text-xs">
                                © 2024 NoCodePage. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default NewWebsiteEmail;
