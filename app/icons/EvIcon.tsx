// components/icons/vehicle-icons/EvIcon.tsx

const EvIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => {
    return (
        <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle 
                cx="24" 
                cy="42" 
                r="6" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <circle 
                cx="55" 
                cy="42" 
                r="6" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <path 
                d="M61,24H44.657c-1.061,0-2.078-0.421-2.828-1.172L38,19" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <path 
                d="M36,40h13.349c0.825-2.329,3.04-4,5.651-4s4.827,1.671,5.651,4H67c2.209,0,4-1.791,4-4v-4c0-4.418-3.582-8-8-8h-4.963 c-1.28,0-2.482-0.612-3.235-1.647l-3.807-5.234C49.113,14.531,46.107,13,42.908,13H23.338c-1.933,0-3.59,1.383-3.935,3.284 l-0.806,4.431C18.251,22.617,16.595,24,14.662,24H13c-2.209,0-4,1.791-4,4v8c0,2.209,1.791,4,4,4h5.349 c0.825-2.329,3.04-4,5.651-4s4.827,1.671,5.651,4" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <path 
                d="M40,40v11c0,2.209-1.791,4-4,4h-8.5c-1.933,0-3.5,1.567-3.5,3.5v0c0,1.933,1.567,3.5,3.5,3.5H46" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <path 
                d="M49,57h1c1.657,0,3,1.343,3,3v4c0,1.657-1.343,3-3,3h-1c-1.657,0-3-1.343-3-3v-4C46,58.343,47.343,57,49,57z" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <line 
                x1="56" 
                x2="52.829" 
                y1="59" 
                y2="59" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
            <line 
                x1="56" 
                x2="52.829" 
                y1="65" 
                y2="65" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeMiterlimit="10" 
                strokeWidth="4"
            />
        </svg>
    );
};

export default EvIcon;
